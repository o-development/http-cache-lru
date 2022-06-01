/**
 * Tests copied and modified from https://github.com/jimmywarting/cache-polyfill/tree/master/test
 */
import { caches } from "../lib/index";
import { Request, Response } from "cross-fetch";

describe("cache-match", () => {
  beforeEach(() => caches.delete("v1"));

  it("Cache.match with no matching entries", async () => {
    const cache = await caches.open("v1");
    const result = await cache.match("not-present-in-the-cache");
    console.assert(
      result === undefined,
      "Cache.match failures should resolve with undefined."
    );
  });

  it("Cache.match with no matching entries", async () => {
    const cache = await caches.open("v1");
    const result = await cache.match("not-present-in-the-cache");
    console.assert(
      result === undefined,
      "Cache.match failures should resolve with undefined."
    );
  });

  it("Cache.match with no matching entries", async () => {
    const cache = await caches.open("v1");
    const result = await cache.match("not-present-in-the-cache");
    console.assert(
      result === undefined,
      "Cache.match failures should resolve with undefined."
    );
  });

  it("Cache.match with URL", async () => {
    const cache = await caches.open("v1");
    const url = "http://example.com/";
    await cache.put(new Request(url), new Response());
    const result = await cache.match(url);
    console.assert(result.url === "", "Cache.match should match by URL.");
  });

  it("Cache.match with Request", async () => {
    const cache = await caches.open("v1");
    const url = "http://example.com/";
    const req = new Request(url);
    await cache.put(req, new Response());
    const result = await cache.match(req);
    console.assert(
      result instanceof Response,
      "Cache.match should match by URL."
    );
  });

  it("Cache.match with HEAD", async () => {
    const cache = await caches.open("v1");
    const url = "http://example.com/";
    await cache.put(new Request(url), new Response());
    const result = await cache.match(new Request(url, { method: "HEAD" }));
    console.assert(
      result === undefined,
      "Cache.match should not match HEAD Request."
    );
  });

  it("Cache.match with ignoreSearch option (request with no search parameters)", async () => {
    const cache = await caches.open("v1");
    const url = "http://example.com/?foo=bar";
    await cache.put(new Request(url), new Response());
    const result = await cache.match(new Request(url), { ignoreSearch: true });
    console.assert(
      result instanceof Response,
      "Cache.match should not match HEAD Request."
    );
  });
});
