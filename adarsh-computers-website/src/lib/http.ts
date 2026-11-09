/** Read a small JSON request without buffering an unbounded public form body. */
export async function readJsonBody(request: Request, maximumBytes = 12 * 1024): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maximumBytes || !request.headers.get("content-type")?.toLowerCase().includes("application/json")) return { ok: false };
  if (!request.body) return { ok: false };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        return { ok: false };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { ok: false };
  } finally {
    reader.releaseLock();
  }
}
