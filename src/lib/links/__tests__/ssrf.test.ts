import { describe, expect, it } from "bun:test";

import { isPrivateIp, parseHttpUrl } from "../ssrf";

describe("isPrivateIp", () => {
  it("flags IPv4 loopback, private, link-local, and CGNAT ranges", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.5.4",
      "172.31.255.255",
      "192.168.0.1",
      "169.254.10.20",
      "100.64.0.1",
      "0.0.0.0",
    ]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });

  it("allows public IPv4", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "93.184.216.34"]) {
      expect(isPrivateIp(ip)).toBe(false);
    }
  });

  it("flags IPv6 loopback, ULA, link-local, and mapped-private", () => {
    for (const ip of [
      "::1",
      "fe80::1",
      "fc00::1",
      "fd12:3456::1",
      "::ffff:127.0.0.1",
      "::ffff:10.0.0.1",
      "::",
    ]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });

  it("allows public IPv6 (incl. mapped public v4)", () => {
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false);
    expect(isPrivateIp("::ffff:8.8.8.8")).toBe(false);
  });
});

describe("parseHttpUrl", () => {
  it("accepts http and https", () => {
    expect(parseHttpUrl("https://example.com/x")?.hostname).toBe("example.com");
    expect(parseHttpUrl("http://example.com")?.hostname).toBe("example.com");
  });

  it("rejects non-http schemes and junk", () => {
    expect(parseHttpUrl("ftp://example.com")).toBeNull();
    expect(parseHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpUrl("file:///etc/passwd")).toBeNull();
    expect(parseHttpUrl("not a url")).toBeNull();
    expect(parseHttpUrl("")).toBeNull();
  });
});
