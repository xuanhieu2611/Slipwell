import { describe, expect, it, vi } from "vitest";
import {
  createPrivateDownloadUrl,
  isWorkspaceStorageObjectKey,
  PRIVATE_DOWNLOAD_TTL_SECONDS,
  PrivateDownloadError,
  type PrivateStorageSigner,
} from "./private-download";

const workspaceId = "11111111-1111-1111-1111-111111111111";

describe("private download URLs", () => {
  it("uses a five-minute signed URL for a workspace-prefixed object", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://storage.example/signed" },
      error: null,
    });
    const signer: PrivateStorageSigner = {
      storage: { from: () => ({ createSignedUrl }) },
    };

    await expect(
      createPrivateDownloadUrl(signer, {
        bucket: "capture-audio",
        workspaceId,
        objectKey: `${workspaceId}/capture.webm`,
      }),
    ).resolves.toBe("https://storage.example/signed");

    expect(createSignedUrl).toHaveBeenCalledWith(
      `${workspaceId}/capture.webm`,
      PRIVATE_DOWNLOAD_TTL_SECONDS,
    );
    expect(PRIVATE_DOWNLOAD_TTL_SECONDS).toBeLessThanOrEqual(5 * 60);
  });

  it("refuses an object outside the requested workspace before signing", async () => {
    const signer: PrivateStorageSigner = {
      storage: {
        from: () => ({ createSignedUrl: vi.fn() }),
      },
    };

    await expect(
      createPrivateDownloadUrl(signer, {
        bucket: "exports",
        workspaceId,
        objectKey: "22222222-2222-2222-2222-222222222222/export.zip",
      }),
    ).rejects.toBeInstanceOf(PrivateDownloadError);

    expect(
      isWorkspaceStorageObjectKey(
        workspaceId,
        `${workspaceId}/nested/export.zip`,
      ),
    ).toBe(true);
  });
});
