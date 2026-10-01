import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../../proxy";

afterEach(() => vi.unstubAllEnvs());

describe("production content security policy", () => {
  it("requires HTTPS for the public hostname behind a loopback reverse proxy", () => {
    vi.stubEnv("NODE_ENV", "production");
    const req = new NextRequest("http://localhost:8080/", {
      headers: { host: "vote.aventuraislesproxy.com" },
    });
    expect(proxy(req).headers.get("Content-Security-Policy")).toContain(
      "upgrade-insecure-requests",
    );
  });

  it.each(["localhost:3010", "127.0.0.1:3010", "[::1]:3010"])(
    "allows HTTP preview assets on %s",
    (host) => {
      vi.stubEnv("NODE_ENV", "production");
      const req = new NextRequest("http://localhost:3010/", {
        headers: { host },
      });
      expect(proxy(req).headers.get("Content-Security-Policy")).not.toContain(
        "upgrade-insecure-requests",
      );
    },
  );
});
