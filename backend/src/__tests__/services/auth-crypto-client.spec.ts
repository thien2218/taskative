import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthCryptoClient } from "@/services/authCryptoClient";

function makeEnv(fetchImpl: (req: Request) => Promise<Response>) {
  return {
    AUTH_SERVICE: { fetch: fetchImpl },
  } as any;
}

describe("AuthCryptoClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: AuthCryptoClient;

  beforeEach(() => {
    fetchMock = vi.fn();
    client = new AuthCryptoClient(makeEnv(fetchMock));
  });

  it("hash sends request and returns hash", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ hash: "hashed" }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const out = await client.hash("pw", 4);
    expect(out).toBe("hashed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("verify returns boolean", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ valid: true }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const out = await client.verify("pw", "hash");
    expect(out).toBe(true);
  });
});
