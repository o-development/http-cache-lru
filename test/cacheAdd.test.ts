/**
 * Tests copied and modified from https://github.com/jimmywarting/cache-polyfill/tree/master/test
 */
import { caches } from "../lib";
import { Request, Response } from "cross-fetch";

describe("cache-add", () => {
  beforeEach(() => caches.delete("v1"));

  it("Cache.add called with no arguments", async () => {
    const cache = await caches.open("v1");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const err = await cache.add().catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.add called with absolute URL specified as a string", async () => {
    const cache = await caches.open("v1");
    const uri =
      "https://httpbin.org/response-headers?cache-control=max-age%3D604800";
    const result = await cache.add(uri);
    expect(result).toBeUndefined();
    const response = await cache.match(uri);
    expect(response).toBeInstanceOf(Response);
    const body = await (response as Response).json();
    expect(body["Content-Length"]).toBe("107");
  });

  it("Cache.add called with non-HTTP/HTTPS URL", async () => {
    const cache = await caches.open("v1");
    const result = await cache
      .add("javascript://this-is-not-http-mmkay")
      .catch((a) => a);
    expect(result).toBeInstanceOf(TypeError);
  });

  it("Cache.add called with Request object", async () => {
    const cache = await caches.open("v1");
    const request = new Request("https://httpbin.org/get");
    const result = await cache.add(request);
    expect(result).toBeUndefined();
  });

  it("Cache.add called with POST request", async () => {
    const cache = await caches.open("v1");
    const request = new Request("https://httpbin.org/get", {
      method: "POST",
      body: "This is a body.",
    });
    const result = await cache.add(request).catch((a) => a);
    expect(result).toBeInstanceOf(TypeError);
  });

  it("Cache.add called twice with the same Request object", async () => {
    const cache = await caches.open("v1");
    const request = new Request("https://httpbin.org/get");
    let result = await cache.add(request);
    expect(result).toBeUndefined();
    result = await cache.add(request);
    expect(result).toBeUndefined();
  });

  it("Cache.add with request that results in a status of 404", async () => {
    const cache = await caches.open("v1");
    const err = await cache
      .add("http://httpbin.org/status/404")
      .catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.add with request that results in a status of 500", async () => {
    const cache = await caches.open("v1");
    const err = await cache
      .add("http://httpbin.org/status/500")
      .catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.add with request that results in a status of 206", async () => {
    const cache = await caches.open("v1");
    const err = await cache
      .add("http://httpbin.org/status/206")
      .catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.addAll with no arguments", async () => {
    const cache = await caches.open("v1");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const err = await cache.addAll().catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.addAll with a mix of valid and undefined arguments", async () => {
    const cache = await caches.open("v1");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const err = await cache.addAll().catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.addAll should throw TypeError for an undefined argument.", async () => {
    const cache = await caches.open("v1");
    // Assumes the existence of http://httpbin.org/status/200
    const urls = ["http://httpbin.org/status/200", undefined];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const err = await cache.addAll(urls).catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("There should be no entry in the cache.", async () => {
    const cache = await caches.open("v1");
    const result = await cache.addAll([]);
    expect(result).toBeUndefined();
    const keys = await cache.keys();
    expect(keys.length).toBe(0);
  });

  it("Cache.addAll with Request arguments", async () => {
    const cache = await caches.open("v1");
    // Assumes the existence of this
    const urls = [
      "https://httpbin.org/response-headers?cache-control=max-age%3D604800&echo=foo",
      "https://httpbin.org/response-headers?cache-control=max-age%3D604800&echo=bar",
    ];
    const result = await cache.addAll(urls);
    expect(result).toBe(undefined);
    const responses = (await Promise.all(
      urls.map((url) => cache.match(url))
    )) as Response[];
    expect(responses[0]).toBeInstanceOf(Response);
    expect(responses[1]).toBeInstanceOf(Response);
    const bodies = await Promise.all(
      responses.map((response) => response.json())
    );
    expect(bodies[0].echo).toBe("foo");
    expect(bodies[1].echo).toBe("bar");
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
    expect(err).toBeInstanceOf(TypeError);
    const matches = await Promise.all(urls.map((url) => cache.match(url)));
    expect(matches[0]).toBe(undefined);
    expect(matches[1]).toBe(undefined);
  });
});
