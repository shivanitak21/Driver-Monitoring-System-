import * as FileSystem from "expo-file-system/legacy";

/**
 * Guardian media decode helpers.
 * See docs/GUARDIAN_ANDROID_DECODE.md — stills are JPEG, clips are MP4,
 * LiveKit tracks are decoded by LiveKit (not here).
 */

/** Strip a data-URL prefix so we keep raw base64 for FileSystem / Image. */
export function stripBase64Prefix(value: string): string {
  const trimmed = value.trim();
  const comma = trimmed.indexOf(",");
  if (trimmed.startsWith("data:") && comma >= 0) return trimmed.slice(comma + 1);
  return trimmed;
}

/** JPEG still from `image_b64` — feed to Image / expo-image, never a video player. */
export function jpegDataUriFromBase64(imageB64: string | null | undefined): string {
  if (!imageB64) return "";
  const raw = stripBase64Prefix(imageB64);
  if (!raw) return "";
  return `data:image/jpeg;base64,${raw}`;
}

/** True when decoded bytes look like an MP4 (`ftyp` near the start). */
export function looksLikeMp4Base64(videoB64: string): boolean {
  try {
    const raw = stripBase64Prefix(videoB64);
    // First ~32 bytes as base64 ≈ 44 chars; enough to see `ftyp`.
    const head = raw.slice(0, 64);
    const binary =
      typeof atob === "function"
        ? atob(head)
        : // React Native without atob: treat as opaque and allow write.
          "";
    if (!binary) return raw.length > 32;
    return binary.includes("ftyp");
  } catch {
    return false;
  }
}

/**
 * Write `video_b64` (one complete H.264/AAC MP4) to a local `.mp4` file.
 * Do not pass the base64 string to a player as a URL.
 */
export async function writeMp4FromBase64(
  videoB64: string,
  filename = `vms-clip-${Date.now()}.mp4`,
): Promise<string> {
  const raw = stripBase64Prefix(videoB64);
  if (!raw) throw new Error("No video_b64 data to save.");
  if (!looksLikeMp4Base64(raw)) {
    throw new Error("Decoded bytes are not an MP4 (missing ftyp).");
  }
  const base = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!base) throw new Error("No writable directory on this device.");
  const safe = filename.endsWith(".mp4") ? filename : `${filename}.mp4`;
  const path = `${base}${safe}`;
  await FileSystem.writeAsStringAsync(path, raw, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists || (typeof info.size === "number" && info.size < 32)) {
    throw new Error("MP4 write was cut short — player cannot open the file.");
  }
  return path;
}
