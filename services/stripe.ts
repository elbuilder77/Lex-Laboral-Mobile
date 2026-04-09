export const createCheckoutSession = async (
  userEmail: string,
  userId: string,
  plan: 'analisis' | 'draft_basic' | 'mensualidad' | 'trimestralidad',
  accessToken: string
) => {
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const response = await fetch(`${API_URL}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      userEmail,
      userId,
      plan
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to create checkout session';
    const vercelRequestId = response.headers.get('x-vercel-id');
    const responseText = await response.text();

    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      console.error('Stripe checkout non-JSON error response', {
        status: response.status,
        vercelRequestId,
        bodyPreview: responseText.slice(0, 500)
      });
      errorMessage = `Server error (${response.status}). Revisa los logs de Vercel con request id ${vercelRequestId || 'N/A'}.`;
    }
    throw new Error(errorMessage);
  }

  const session = await response.json();
  return session as { id: string; url: string };
};

export const redirectToCheckout = async (checkoutUrl: string) => {
  if (!checkoutUrl) {
    throw new Error('Stripe no devolvió una URL de checkout.');
  }

  window.location.assign(checkoutUrl);
};
