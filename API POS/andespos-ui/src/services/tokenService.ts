const PRECIOS_BASE = `${import.meta.env.VITE_API_BASE || '/api/AndesPOSAPI2602N/POS/AI_API'}/Precios/xListaDePrecios`;

export async function generateToken(strControl: string): Promise<string> {
  const response = await fetch(`${PRECIOS_BASE}/GetToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ StrControl: strControl }),
  });

  if (!response.ok) {
    throw new Error(`Error al obtener token: ${response.status}`);
  }

  const data = await response.json();
  return data.Token as string;
}