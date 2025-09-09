import { describe, it, expect } from "vitest";
import app from "@/workers/auth";

describe("Auth Worker", () => {
  it("hashes a password", async () => {
    const res = await app.request("http://auth/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "secret", cost: 4 }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.hash).toBe("string");
    expect(data.hash.length).toBeGreaterThan(20);
  });

  it("verifies a password and hash pair", async () => {
    const hashRes = await app.request("http://auth/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "secret", cost: 4 }),
    });
    const { hash } = await hashRes.json();

    const verifyRes = await app.request("http://auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "secret", hash }),
    });
    const data = await verifyRes.json();
    expect(data.valid).toBe(true);
  });
});
