import { GoogleGenerativeAI } from '@google/generative-ai';
import { executeWithGeminiFallback, SYSTEM_INSTRUCTION } from './_utils/ai.js';
import { getAuthenticatedUser } from './_utils/auth.js';
import { applyRateLimit } from './_utils/rateLimit.js';
import { handlePreflight, validateOrigin, sanitizeInput, setSecurityHeaders } from './_utils/security.js';
import { checkDocumentAccess, consumeDocumentAccess } from '../lib/server-access.js';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { retrieveRelevantContext } from './_utils/rag.js';

export default async function handler(req: any, res: any) {
  // Security: CORS preflight
  if (handlePreflight(req, res)) return;
  setSecurityHeaders(res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Security: Rate limit — max 5 requests per minute per IP (protects Gemini API costs)
  if (applyRateLimit(req, res, 5, 60_000)) return;

  // Security: Origin validation
  if (validateOrigin(req, res)) return;

  try {
    const { requirements, customInstructions } = req.body;

    // Security: Input validation
    const cleanRequirements = sanitizeInput(requirements, 5000);
    if (!cleanRequirements) {
      return res.status(400).json({ error: 'Los requerimientos son obligatorios y no deben estar vacíos.' });
    }
    const cleanInstructions = sanitizeInput(customInstructions, 2000);

    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: 'No autorizado. Inicia sesión para generar documentos.' });
    }

    const accessStatus = await checkDocumentAccess(user.id);
    if (!accessStatus?.allowed) {
      if (accessStatus?.reason === 'fair_use_limit') {
        return res.status(429).json({ error: 'Has alcanzado el límite de Uso Justo para documentos de este mes. Si necesitas ampliarlo, contáctanos.' });
      }

      return res.status(402).json({ error: 'Necesitas un plan activo o comprar un Documento Suelto para generar este instrumento.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    // RAG: Obtener contexto jurídico relevante basado en los requerimientos
    const ragContext = await retrieveRelevantContext(supabaseAdmin, genAI, cleanRequirements);

    const promptText = `CONTEXTO JURÍDICO DE REFERENCIA:
${ragContext || 'No hay contexto de referencia disponible. Utiliza tu base de conocimientos interna.'}

TAREA: Proyecta el siguiente instrumento jurídico con base en los requerimientos. ES ESTRICTAMENTE OBLIGATORIO que utilices la estructura de [Proemio, Prestaciones o Declaraciones, Hechos o Cláusulas, Derecho, Puntos Resolutivos y Firmas] aplicable al tipo de documento.

Requerimientos del usuario:
${cleanRequirements}

Instrucciones extra:
${cleanInstructions || 'Ninguna'}
`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullText = '';

    await executeWithGeminiFallback(genAI, SYSTEM_INSTRUCTION, true, async (model) => {
      const resultStream = await model.generateContentStream(promptText);
      for await (const chunk of resultStream.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    });

    const accessConsumption = await consumeDocumentAccess(user.id);
    if (!accessConsumption?.allowed) {
      console.warn('[Draft] Access changed after generation completed. Returning document without a confirmed consumption.', {
        userId: user.id,
        precheckReason: accessStatus.reason,
        postConsumeReason: accessConsumption?.reason || 'unknown',
      });
    }

    if ((accessConsumption?.reason || accessStatus.reason) === 'single_document') {
      const footer = '\n\n---\n*Generado con Inteligencia Artificial por Lex Laboral. Activa un plan para acceso ampliado al generador y a la calculadora IMSS en https://lexlaboral.com.mx*';
      res.write(`data: ${JSON.stringify({ text: footer })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Draft API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
