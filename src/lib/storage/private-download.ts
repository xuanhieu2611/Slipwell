export const PRIVATE_DOWNLOAD_TTL_SECONDS = 5 * 60;

export type PrivateStorageBucket = "capture-audio" | "exports";

export type PrivateDownloadRequest = Readonly<{
  bucket: PrivateStorageBucket;
  workspaceId: string;
  objectKey: string;
}>;

export type PrivateStorageSigner = Readonly<{
  storage: Readonly<{
    from: (bucket: PrivateStorageBucket) => Readonly<{
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{
        data: { signedUrl: string } | null;
        error: unknown;
      }>;
    }>;
  }>;
}>;

export class PrivateDownloadError extends Error {
  constructor() {
    super("The requested private download is unavailable.");
    this.name = "PrivateDownloadError";
  }
}

export function isWorkspaceStorageObjectKey(
  workspaceId: string,
  objectKey: string,
): boolean {
  return (
    objectKey.startsWith(`${workspaceId}/`) &&
    objectKey.length > workspaceId.length + 1
  );
}

/**
 * The storage policy independently verifies the workspace prefix. This check
 * prevents server code from minting a URL for a malformed or cross-workspace
 * object before the request reaches Storage.
 */
export async function createPrivateDownloadUrl(
  signer: PrivateStorageSigner,
  request: PrivateDownloadRequest,
): Promise<string> {
  if (!isWorkspaceStorageObjectKey(request.workspaceId, request.objectKey)) {
    throw new PrivateDownloadError();
  }

  const { data, error } = await signer.storage
    .from(request.bucket)
    .createSignedUrl(request.objectKey, PRIVATE_DOWNLOAD_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new PrivateDownloadError();
  }

  return data.signedUrl;
}
