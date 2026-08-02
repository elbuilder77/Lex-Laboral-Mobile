
const API_URL = import.meta.env.VITE_API_URL || '/api';
const STREAM_RENDER_INTERVAL_MS = 100;

export const draftLegalDocument = async (
  requirements: string, 
  customInstructions?: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const response = await fetch(`${API_URL}/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requirements, customInstructions })
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
  let streamError: string | null = null;
  let lastProgressEmit = 0;

  const emitProgress = (force = false) => {
    if (!onChunk) return;

    const now = Date.now();
    if (force || now - lastProgressEmit >= STREAM_RENDER_INTERVAL_MS) {
      onChunk(fullText);
      lastProgressEmit = now;
    }
  };

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
          if (data.error) {
            streamError = data.error;
            continue;
          }
          if (data.text) {
            fullText += data.text;
            emitProgress();
          }
        } catch (e) {
          console.warn('Error parsing SSE data', dataStr);
        }
      }
    }
  }

  emitProgress(true);

  if (streamError) {
    throw new Error(streamError);
  }

  return fullText;
};
