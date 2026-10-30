import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

/** Download a remote JPEG and save it to the device photo library. */
export async function saveRemoteImageToGallery(url: string, filename = `vms-${Date.now()}.jpg`) {
  if (!url) throw new Error("No image URL to save.");
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to save snapshots.");
  }
  const base = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!base) throw new Error("No writable cache directory on this device.");
  const path = `${base}${filename}`;
  const download = await FileSystem.downloadAsync(url, path);
  const asset = await MediaLibrary.createAssetAsync(download.uri);
  return asset;
}
