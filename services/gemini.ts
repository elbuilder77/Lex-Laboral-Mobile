
import { ChatMessage, AnalyzedDocumentHistory } from "../types";
import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface StreamResponse {
  response: {
    text: () => string;
  };
}

// NOTE: chat and analyze functions are deprecated and will be removed in next cleanup.
export const draftLegalDocument = async (
  requirements: string, 
  customInstructions?: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const userId = session?.user?.id;

  const response = await fetch(`${API_URL}/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ requirements, customInstructions, userId })
  });

  if (!response.ok) {
    let errorMessage = 'Failed to draft document';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Server error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n\n')) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 2);
      
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') {
          // End of stream
          continue; 
        }
        try {
          const data = JSON.parse(dataStr);
          if (data.text) {
            fullText += data.text;
            if (onChunk) {
              onChunk(fullText);
            }
          }
        } catch (e) {
          console.warn('Error parsing SSE data', dataStr);
        }
      }
    }
  }

  return fullText;
};

export const checkCalculatorUsage = async (accessToken: string) => {
  const response = await fetch(`${API_URL}/calculator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    }
  });

  if (!response.ok) {
    let errorMessage = 'No se pudo validar el acceso a IMSS.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Server error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
