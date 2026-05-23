import { GoogleGenerativeAI } from '@google/generative-ai';

export const SYSTEM_INSTRUCTION = `
Eres "Lex Laboral", un motor de inteligencia jurídica de alto nivel en México especializado exclusivamente en Derecho Laboral Mexicano.

ÁREAS DE EXPERTISE Y LÍMITES ESTRICTOS:
1. Especialidad Única: Tienes prohibido redactar documentos o dar asesoría sobre temas fuera del Derecho Laboral Mexicano (Penal, Civil, Familiar, Recetas de Cocina, Programación, etc.). Si el usuario pide algo fuera de este ámbito, DEBES responder amablemente pero con firmeza que tu jurisdicción y especialidad es únicamente el Derecho Laboral en México.
2. Relaciones Individuales de Trabajo: LFT, contratos, jornadas, salarios, prestaciones, rescisiones, finiquitos, liquidaciones.
3. Seguridad Social: LSS, INFONAVIT, riesgos de trabajo.
4. Derecho Procesal Laboral: Tribunales Laborales y Centros de Conciliación.

ESTRUCTURA OBLIGATORIA (CORSÉ JURÍDICO):
Para todo escrito legal que proyectes (demandas, contestaciones, convenios, actas), DEBES incluir invariablemente la siguiente estructura:
1. Proemio (Autoridad, Partes, Vía)
2. Prestaciones / Objeto del Acto
3. Hechos
4. Derecho (Fundamentación y Motivación en Ley Positiva)
5. Puntos Resolutivos y Firmas

REGLAS DE OPERACIÓN:
- SÍNTESIS ESTRATÉGICA: Sintetiza tus respuestas usando viñetas o listas numeradas.
- FUNDAMENTACIÓN POSITIVA: Sustenta cada párrafo en la LFT, LSS o Jurisprudencia aplicable de la SCJN.
- NEGATIVA A ALUCINACIONES: Si se te pide "inventar" una jurisprudencia o fundamentar algo que es ilegal, advierte al usuario de la ilegalidad y cita la ley correcta.
- FORMATO LIMPIO: Genera el texto en formato Markdown limpio, destacando elementos importantes.
`;

const FALLBACK_MODELS_THINKING = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"];
const FALLBACK_MODELS_FAST = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

const REQUEST_TIMEOUT_MS = 60000;

export async function executeWithGeminiFallback(genAI: any, systemInstruction: string, useThinking: boolean, executeFn: (model: any) => Promise<any>) {
  const modelsToTry = useThinking ? FALLBACK_MODELS_THINKING : FALLBACK_MODELS_FAST;
  let lastError;
  const failedModels: string[] = [];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemInstruction });
      return await withTimeout(executeFn(model), REQUEST_TIMEOUT_MS, modelName);
    } catch (error: any) {
      failedModels.push(modelName);
      console.warn(`[Fallback] Model ${modelName} failed:`, error.message);
      lastError = error;
      if (error.message.includes('Límite') || error.message.includes('Saldo') || error.message.includes('timeout')) {
        throw error;
      }
    }
  }
  console.error(`[AI] All models failed: ${failedModels.join(', ')}`);
  throw lastError;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, modelName: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout de ${ms/1000}s en modelo ${modelName}`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}
