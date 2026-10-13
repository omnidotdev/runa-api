import { describe, expect, test } from "bun:test";

import { assertAllowedWebhookUrl, blockedWebhookHostReason } from "./ssrfGuard";

describe("blockedWebhookHostReason", () => {
  test("allows ordinary public hosts and IPs", () => {
    for (const host of [
      "example.com",
      "hooks.example.com",
      "8.8.8.8",
      "11.0.0.1",
      "172.32.0.1", // just outside 172.16/12
      "203.0.113.5",
    ]) {
      expect(blockedWebhookHostReason(host)).toBeNull();
    }
  });

  test("blocks loopback, unspecified, and localhost", () => {
    for (const host of [
      "localhost",
      "127.0.0.1",
      "127.1.2.3",
      "0.0.0.0",
      "::1",
    ]) {
      expect(blockedWebhookHostReason(host)).not.toBeNull();
    }
  });

  test("blocks RFC1918 private IPv4 ranges", () => {
    for (const host of [
      "10.0.0.5",
      "192.168.1.1",
      "172.16.0.1",
      "172.31.255.1",
    ]) {
      expect(blockedWebhookHostReason(host)).not.toBeNull();
    }
  });

  test("blocks link-local and the cloud metadata address", () => {
    for (const host of ["169.254.0.1", "169.254.169.254"]) {
      expect(blockedWebhookHostReason(host)).not.toBeNull();
    }
  });

  test("blocks private/link-local IPv6", () => {
    for (const host of ["fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
      expect(blockedWebhookHostReason(host)).not.toBeNull();
    }
  });

  test("blocks internal-only hostnames", () => {
    for (const host of ["db.internal", "service.local", "runa-api"]) {
      expect(blockedWebhookHostReason(host)).not.toBeNull();
    }
  });
});

describe("assertAllowedWebhookUrl", () => {
  test("accepts https (and http) to a public host", () => {
    expect(() =>
      assertAllowedWebhookUrl("https://hooks.example.com/x"),
    ).not.toThrow();
    expect(() =>
      assertAllowedWebhookUrl("http://example.com:8080/y"),
    ).not.toThrow();
  });

  test("rejects non-http(s) schemes", () => {
    expect(() => assertAllowedWebhookUrl("ftp://example.com")).toThrow();
    expect(() => assertAllowedWebhookUrl("file:///etc/passwd")).toThrow();
  });

  test("rejects a private/loopback target", () => {
    expect(() => assertAllowedWebhookUrl("http://127.0.0.1/hook")).toThrow();
    expect(() =>
      assertAllowedWebhookUrl("https://169.254.169.254/latest/meta-data"),
    ).toThrow();
  });

  test("rejects a malformed url", () => {
    expect(() => assertAllowedWebhookUrl("not a url")).toThrow();
  });
});
