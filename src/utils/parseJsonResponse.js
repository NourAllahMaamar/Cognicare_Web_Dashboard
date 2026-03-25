/**
 * Parse fetch Response body as JSON when possible.
 * Avoids throwing SyntaxError when the server returns HTML/plain text (e.g. proxy 502, nginx error page).
 */
export async function parseJsonResponse(response, fallbackMessage) {
  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new Error(fallbackMessage || `Request failed (${response.status})`);
    }
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    if (!response.ok) {
      const trimmed = text.trim();
      const short = trimmed.length <= 200 ? trimmed : null;
      throw new Error(short || fallbackMessage || `Request failed (${response.status})`);
    }
    throw new Error('Invalid response from server');
  }
}
