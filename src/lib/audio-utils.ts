export function base64ToAudioBlob(
  base64Audio: string,
  mimeType = "audio/mpeg"
): Blob {
  const audioData = atob(base64Audio);
  const audioArray = new Uint8Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    audioArray[i] = audioData.charCodeAt(i);
  }
  return new Blob([audioArray], { type: mimeType });
}
