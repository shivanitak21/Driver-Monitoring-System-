import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

async function ensureLibraryPermission() {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to save media.");
  }
}

function cachePath(filename: string) {
  const base = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!base) throw new Error("No writable cache directory on this device.");
  return `${base}${filename}`;
}

/** Download a remote JPEG and save it to the device photo library. */
export async function saveRemoteImageToGallery(url: string, filename = `vms-${Date.now()}.jpg`) {
  if (!url) throw new Error("No image URL to save.");
  await ensureLibraryPermission();
  const path = cachePath(filename);
  const download = await FileSystem.downloadAsync(url, path);
  return MediaLibrary.createAssetAsync(download.uri);
}

/** Save a base64 payload (no data: prefix) to the photo library. */
export async function saveBase64ToGallery(
  base64: string,
  filename: string,
  _mimeHint?: string,
) {
  if (!base64) throw new Error("No media data to save.");
  await ensureLibraryPermission();
  const path = cachePath(filename);
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return MediaLibrary.createAssetAsync(path);
}
