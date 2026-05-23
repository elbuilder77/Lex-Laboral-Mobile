import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Genera el vector de embedding para un texto dado usando text-embedding-004 de Gemini.
 * 
 * @param genAI - Instancia del cliente de GoogleGenerativeAI
 * @param text - Texto a vectorizar
 * @returns Array de numbers con el embedding (768 dimensiones)
 */
export async function getEmbedding(genAI: GoogleGenerativeAI, text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  
  if (!result?.embedding?.values) {
    throw new Error('No se pudo generar el embedding a partir de la API de Gemini.');
  }
  
  return result.embedding.values;
}

/**
 * Recupera el contexto legal relevante de la base de conocimiento en Supabase
 * realizando una búsqueda semántica basada en los requerimientos del usuario.
 * 
 * @param supabase - Instancia del cliente de Supabase (con privilegios de consulta de kb_articles)
 * @param genAI - Instancia de GoogleGenerativeAI
 * @param requirements - Requerimientos del usuario en lenguaje natural
 * @returns String con el contexto legal formateado o vacío si no hay coincidencias
 */
export async function retrieveRelevantContext(
  supabase: any,
  genAI: GoogleGenerativeAI,
  requirements: string
): Promise<string> {
  try {
    if (!requirements || requirements.trim().length === 0) {
      return '';
    }

    console.log('[RAG] Generando embedding para los requerimientos...');
    const embedding = await getEmbedding(genAI, requirements.trim());

    console.log('[RAG] Realizando búsqueda semántica de artículos en Supabase...');
    const { data: articles, error } = await supabase.rpc('match_kb_articles', {
      query_embedding: embedding,
      match_threshold: 0.40, // Nivel óptimo de coincidencia semántica incrementado para mayor precisión
      match_count: 5 // Aumentado para proveer mayor contexto a la IA
    });

    if (error) {
      // Si la tabla o la función no existen en la base de datos, registrar advertencia de forma segura
      console.warn('[RAG] Advertencia al llamar a match_kb_articles:', error.message);
      return '';
    }

    if (!articles || articles.length === 0) {
      console.log('[RAG] No se encontraron artículos jurídicos relevantes en la base de conocimiento.');
      return '';
    }

    console.log(`[RAG] Búsqueda exitosa. Se recuperaron ${articles.length} artículos relevantes.`);
    
    // Formatear el contexto recuperado de forma clara para el LLM
    return articles
      .map((art: any, index: number) => 
        `--- REFERENCIA LEGAL ${index + 1}: ${art.title} (Similitud Semántica: ${Math.round((art.similarity || 0) * 100)}%) ---\n${art.content}`
      )
      .join('\n\n');
  } catch (err: any) {
    console.error('[RAG] Error crítico en retrieveRelevantContext:', err.message || err);
    return ''; // Falla resiliente para asegurar que el generador de borradores continúe operando
  }
}
