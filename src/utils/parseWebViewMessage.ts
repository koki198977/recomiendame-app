export interface WebViewMessage {
  type: 'STATE_CHANGE';
  state: number;
  currentTime: number;
}

/**
 * Parses a raw WebView postMessage string into a WebViewMessage.
 * Returns null if the string is not valid JSON or is missing required fields.
 * Never throws.
 */
export function parseWebViewMessage(raw: string): WebViewMessage | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      parsed.type !== undefined &&
      parsed.state !== undefined &&
      parsed.currentTime !== undefined
    ) {
      return parsed as WebViewMessage;
    }
    return null;
  } catch {
    return null;
  }
}
