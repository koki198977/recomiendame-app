/**
 * Extracts the YouTube video ID from a URL.
 * Supports formats:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *
 * @returns The video ID string, or null if no match is found.
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;

  // youtube.com/watch?v=ID
  const watchMatch = url.match(/youtube\.com\/watch\?(?:.*&)?v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
}
