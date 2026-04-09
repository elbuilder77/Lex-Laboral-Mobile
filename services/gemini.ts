
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
  customInstructions?: string
) => {
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

  const data = await response.json();
  return data.text;
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
