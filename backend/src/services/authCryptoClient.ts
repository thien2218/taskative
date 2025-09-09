import type { Bindings } from "@/types";

export class AuthCryptoClient {
  constructor(private readonly env: Bindings) {}

  async hash(password: string, cost = 11): Promise<string> {
    const req = new Request("https://auth/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, cost }),
    });
    const res = await this.env.AUTH_SERVICE.fetch(req);
    if (!res.ok) {
      throw new Error(`Auth service hash failed: ${res.status}`);
    }
    const data = (await res.json()) as { hash: string };
    return data.hash;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const req = new Request("https://auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, hash }),
    });
    const res = await this.env.AUTH_SERVICE.fetch(req);
    if (!res.ok) {
      return false;
    }
    const data = (await res.json()) as { valid: boolean };
    return !!data.valid;
  }
}

export default AuthCryptoClient;
