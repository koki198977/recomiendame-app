import { parseWebViewMessage } from './parseWebViewMessage';

describe('parseWebViewMessage', () => {
  it('parses a valid STATE_CHANGE message', () => {
    const msg = JSON.stringify({ type: 'STATE_CHANGE', state: 2, currentTime: 12.5 });
    const result = parseWebViewMessage(msg);
    expect(result).toEqual({ type: 'STATE_CHANGE', state: 2, currentTime: 12.5 });
  });

  it('returns null for non-JSON string', () => {
    expect(parseWebViewMessage('not json')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseWebViewMessage('')).toBeNull();
  });

  it('returns null when type field is missing', () => {
    const msg = JSON.stringify({ state: 2, currentTime: 5 });
    expect(parseWebViewMessage(msg)).toBeNull();
  });

  it('returns null when state field is missing', () => {
    const msg = JSON.stringify({ type: 'STATE_CHANGE', currentTime: 5 });
    expect(parseWebViewMessage(msg)).toBeNull();
  });

  it('returns null when currentTime field is missing', () => {
    const msg = JSON.stringify({ type: 'STATE_CHANGE', state: 0 });
    expect(parseWebViewMessage(msg)).toBeNull();
  });

  it('does not throw for arbitrary strings', () => {
    expect(() => parseWebViewMessage('{{invalid}}')).not.toThrow();
    expect(() => parseWebViewMessage('null')).not.toThrow();
    expect(() => parseWebViewMessage('undefined')).not.toThrow();
  });
});
