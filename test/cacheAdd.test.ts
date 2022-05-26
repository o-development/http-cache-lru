/**
 * Tests copied and modified from https://github.com/jimmywarting/cache-polyfill/tree/master/test
 */
import { caches } from "../lib";
const isRes = (x) => x instanceof Response;
// const isReq = (x) => x instanceof Request;

describe("cache-add", () => {
  beforeEach(() => caches.delete("v1"));
  it("Cache.add called with no arguments", async () => {
    const cache = await caches.open("v1");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const err = await cache.add().catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.add should throw a TypeError when no arguments are given."
    );
  });

  it("Cache.add called with absolute URL specified as a string", async () => {
    const cache = await caches.open("v1");
    const result = await cache.add("https://httpbin.org/get?echo=foo");
    console.assert(
      result === undefined,
      "Cache.add should resolve with undefined on success."
    );
    const response = await cache.match("https://httpbin.org/get?echo=foo");
    console.assert(
      isRes(response),
      "Cache.add should put a resource in the cache."
    );
    const body = await response.json();
    console.assert(
      body.args.echo === "foo",
      "Cache.add should retrieve the correct body."
    );
  });

  it("Cache.add called with non-HTTP/HTTPS URL", async () => {
    const cache = await caches.open("v1");
    const result = await cache
      .add("javascript://this-is-not-http-mmkay")
      .catch((a) => a);
    console.assert(
      result instanceof TypeError,
      "Cache.add should throw a TypeError for non-HTTP/HTTPS URLs."
    );
  });

  it("Cache.add called with Request object", async () => {
    const cache = await caches.open("v1");
    const request = new Request("https://httpbin.org/get");
    const result = await cache.add(request);
    console.assert(
      result === undefined,
      "Cache.add should resolve with undefined on success."
    );
  });

  it("Cache.add called with POST request", async () => {
    const cache = await caches.open("v1");
    const request = new Request("https://httpbin.org/get", {
      method: "POST",
      body: "This is a body.",
    });
    const result = await cache.add(request).catch((a) => a);
    console.assert(
      result instanceof TypeError,
      "Cache.add should throw a TypeError for non-GET requests."
    );
  });

  it("Cache.add called twice with the same Request object", async () => {
    const cache = await caches.open("v1");
    const request = new Request("https://httpbin.org/get");
    let result = await cache.add(request);
    console.assert(
      result === undefined,
      "Cache.add should resolve with undefined on success."
    );
    result = await cache.add(request);
    console.assert(
      result === undefined,
      "Cache.add should resolve with undefined on success."
    );
  });

  it("Cache.add called with Request object with a used body", async () => {
    const cache = await caches.open("v1");
    const request = new Request("https://httpbin.org/get");
    await request.text(); // TODO: fails in node-fetch
    console.assert(request.bodyUsed === false);
    return cache.add(request);
  });

  it("Cache.add with request that results in a status of 404", async () => {
    const cache = await caches.open("v1");
    const err = await cache
      .add("http://httpbin.org/status/404")
      .catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.add should reject if response is !ok"
    );
  });

  it("Cache.add with request that results in a status of 500", async () => {
    const cache = await caches.open("v1");
    const err = await cache
      .add("http://httpbin.org/status/500")
      .catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.add should reject if response is !ok"
    );
  });

  it("Cache.add with request that results in a status of 206", async () => {
    const cache = await caches.open("v1");
    const err = await cache
      .add("http://httpbin.org/status/206")
      .catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.add should reject on partial response"
    );
  });

  it("Cache.addAll with no arguments", async () => {
    const cache = await caches.open("v1");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const err = await cache.addAll().catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.addAll with no arguments should throw TypeError."
    );
  });

  it("Cache.addAll with a mix of valid and undefined arguments", async () => {
    const cache = await caches.open("v1");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const err = await cache.addAll().catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.addAll with no arguments should throw TypeError."
    );
  });

  // Skipped cuz u can add ['.', 0, false, undefined, true] in chrome...?
  it.skip("Cache.addAll should throw TypeError for an undefined argument.", async () => {
    const cache = await caches.open("v1");
    // Assumes the existence of http://httpbin.org/status/200
    const urls = ["http://httpbin.org/status/200", undefined];
    const err = await cache.addAll(urls).catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.addAll with undefined throw TypeError."
    );
  });

  it("There should be no entry in the cache.", async () => {
    const cache = await caches.open("v1");
    const result = await cache.addAll([]);
    console.assert(
      result === undefined,
      "Cache.addAll should resolve with undefined on success."
    );
    const keys = await cache.keys();
    console.assert(keys.length === 0, "There should be no entry in the cache.");
  });

  it("Cache.addAll with Request arguments", async () => {
    const cache = await caches.open("v1");
    // Assumes the existence of this
    const urls = [
      "https://httpbin.org/get?echo=foo",
      "https://httpbin.org/get?echo=bar",
    ];
    const result = await cache.addAll(urls);
    console.assert(
      result === undefined,
      "Cache.addAll should resolve with undefined on success."
    );
    const responses = await Promise.all(urls.map((url) => cache.match(url)));
    console.assert(
      isRes(responses[0]),
      "Cache.addAll should put a resource in the cache."
    );
    console.assert(
      isRes(responses[1]),
      "Cache.addAll should put a resource in the cache."
    );
    const bodies = await Promise.all(
      responses.map((response) => response.json())
    );
    console.assert(
      bodies[0].args.echo === "foo",
      "Cache.add should retrieve the correct body."
    );
    console.assert(
      bodies[1].args.echo === "bar",
      "Cache.add should retrieve the correct body."
    );
  });

  it("Cache.addAll with a mix of succeeding and failing requests", async () => {
    const cache = await caches.open("v1");
    // Assumes that 1st exist, 2nd does not.
    const urls = [
      "https://httpbin.org/status/200",
      "https://httpbin.org/status/404",
    ];
    const requests = urls.map((url) => new Request(url));
    const err = await cache.addAll(requests).catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.addAll should reject with TypeError if any request fails"
    );
    const matches = await Promise.all(urls.map((url) => cache.match(url)));
    console.assert(
      matches + "" === ",",
      "If any response fails, no response should be added to cache"
    );
  });

  // Skipped cuz it works in the browser...
  it.skip("should throw InvalidStateError if the same request is added twice.", async () => {
    // const cache = await caches.open("v1");
    // const request = new Request("../resources/simple.txt");
    // const err = await cache.addAll([request, request]).catch((a) => a);
    // console.assert(
    //   err instanceof
    //     "Cache.addAll should throw InvalidStateError if the same request is added twice."
    // );
  });
});
