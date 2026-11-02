import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

type Granular = "audio" | "photo" | "video";

function libraryMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : "";
  if (/permission|manifest|audio|denied|requestPermissions/i.test(raw)) {
    return "Photo access isn’t available on this install.";
  }
  return "Couldn’t save to Photos.";
}

async function ensureLibraryPermission() {
  const request = MediaLibrary.requestPermissionsAsync as (
    writeOnly?: boolean,
    granularPermissions?: Granular[],
  ) => Promise<{ granted: boolean }>;
  try {
    // Photos only. The default request also asks for audio, which this app does not declare.
    const permission = await request(true, ["photo"]);
    if (!permission.granted) {
      throw new Error("Allow photo access to save snaps to Photos.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Allow photo")) throw error;
    throw new Error(libraryMessage(error));
  }
}

function cachePath(filename: string) {
  const base = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!base) throw new Error("No writable cache directory on this device.");
  return `${base}${filename}`;
}

/** Write a base64 recording into app storage. Does not ask for photo permission. */
export async function saveBase64File(base64: string, filename: string) {
  if (!base64) throw new Error("No media data to save.");
  const base = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  if (!base) throw new Error("No place to save the recording on this phone.");
  const path = `${base}${filename}`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path;
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
export async function saveBase64ToGallery(base64: string, filename: string, _mimeHint?: string) {
  if (!base64) throw new Error("No media data to save.");
  await ensureLibraryPermission();
  const path = cachePath(filename);
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return MediaLibrary.createAssetAsync(path);
}
