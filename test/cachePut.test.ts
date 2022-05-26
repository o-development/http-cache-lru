/**
 * Tests copied and modified from https://github.com/jimmywarting/cache-polyfill/tree/master/test
 */
import { caches } from "../lib/index";

const test_url = "https://example.com/foo";
const test_body = (body = "Hello world!") => body;

describe("cache-put", () => {
  beforeEach(() => caches.delete("v1"));

  it("Cache.put called with simple Request and Response", async () => {
    const request = new Request(test_url);
    const response = new Response(test_body());
    const cache = await caches.open("v1");
    const result = await cache.put(request, response);
    console.assert(
      result === undefined,
      "Cache.put should resolve with undefined on success."
    );
  });

  it("Cache.put called with Request and Response from fetch()", async () => {
    const cache = await caches.open("v1");
    const test_url = "https://httpbin.org/get?echo=foo";
    const request = new Request(test_url);
    const fetch_result = await fetch(request);
    const response = fetch_result.clone();
    await cache.put(request, fetch_result);
    const match = await cache.match(test_url);
    const bodies = Promise.all([match.text(), response.text()]);
    console.assert(
      bodies[0] === bodies[1],
      "Cache.put should have the same body"
    );
  });

  it("Cache.put with Request without a body", async () => {
    const cache = await caches.open("v1");
    const request = new Request(test_url);
    const response = new Response(test_body());
    console.assert(
      request.bodyUsed === false,
      "[https://fetch.spec.whatwg.org/#dom-body-bodyused] Request.bodyUsed should be initially false."
    );
    await cache.put(request, response);
    console.assert(
      request.bodyUsed === false,
      `Cache.put should not mark empty request's body used`
    );
  });

  it("Cache.put with an empty response body", async () => {
    const cache = await caches.open("v1");
    const request = new Request(test_url);
    const response = new Response("hej", {
      status: 200,
      headers: [["Content-Type", "text/plain"]],
    });
    await cache.put(request, response);
    const result = await cache.match(test_url);
    const body = await result.text();
    console.assert(result.status === 200, "Cache.put should store status.");
    console.assert(
      result.headers.get("Content-Type") === "text/plain",
      "Cache.put should store headers."
    );
    console.assert(body === "hej", "Cache.put should store response body.");
  });

  it("Cache.put with HTTP 500 response", async () => {
    const cache = await caches.open("v1");
    const test_url = "https://httpbin.org/status/500";
    const request = new Request(test_url);
    const fetch_result = await fetch(test_url);
    console.assert(
      fetch_result.status === 500,
      "Test framework error: The status code should be 500."
    );
    // const response = fetch_result.clone();
    await cache.put(request, fetch_result);
    const result = await cache.match(test_url);
    console.assert(
      result.status === 500,
      "Test framework error: The status code should be 500."
    );
    const body = await result.text();
    console.assert(body === "", "Cache.put should store response body.");
  });

  it("Cache.put with HTTP 206 response", async () => {
    const cache = await caches.open("v1");
    const request = new Request("https://httpbin.org/status/206");
    const response = new Response("part...", { status: 206 });
    const err = await cache.put(request, response).catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.put should reject partial response"
    );
  });

  it("Cache.put called twice with matching Requests and different Responses", async () => {
    const cache = await caches.open("v1");
    const alternate_response_body = "New body";
    const alternate_response = new Response(alternate_response_body, {
      statusText: "New status",
    });
    await cache.put(
      new Request(test_url),
      new Response("Old body", { statusText: "Old status" })
    );
    await cache.put(new Request(test_url), alternate_response.clone());
    const result = await cache.match(test_url);
    const body = await result.text();
    console.assert(
      body === alternate_response_body,
      "Cache put should store new response body."
    );
  });

  it("Cache.put called twice with request URLs that differ only by a fragment", async () => {
    const cache = await caches.open("v1");
    const test_url = "https://example.com/foo";
    const first_url = test_url;
    const second_url = first_url + "#(O_o)";
    const alternate_response_body = "New body";
    const alternate_response = new Response(
      test_body(alternate_response_body),
      {
        statusText: "New status",
      }
    );

    await cache.put(
      new Request(first_url),
      new Response(test_body("Old body"), { statusText: "Old status" })
    );
    await cache.put(new Request(second_url), alternate_response.clone());
    const result = await cache.match(test_url);
    const body = await result.text();
    console.assert(
      body === "New body",
      "Cache.put should replace existing response with new response."
    );
  });

  it("Cache.put with a string request", async () => {
    const cache = await caches.open("v1");
    const url = "http://example.com/foo";
    await cache.put(url, new Response(test_body("some body")));
    const response = await cache.match(url);
    const body = await response.text();
    console.assert(
      body === "some body",
      "Cache.put should accept a string as request."
    );
  });

  it("Cache.put with an invalid response", async () => {
    const cache = await caches.open("v1");
    const err = await cache
      .put(new Request(test_url), new Response("Hello world!"))
      .catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.put should only accept a Response object as the response."
    );
  });

  it("Cache.put with a non-HTTP/HTTPS request", async () => {
    const cache = await caches.open("v1");
    const err = await cache
      .put(new Request("file:///etc/passwd"), new Response(test_body()))
      .catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.put should reject non-HTTP/HTTPS requests with a TypeError."
    );
  });

  it("Cache.put with a non-GET request", async () => {
    const cache = await caches.open("v1");
    const request = new Request("http://example.com/foo", { method: "HEAD" });
    const err = await cache
      .put(request, new Response(test_body()))
      .catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.put should throw a TypeError for non-GET requests."
    );
  });

  it("Cache.put with a null response", async () => {
    const cache = await caches.open("v1");
    const err = await cache.put(new Request(test_url), null).catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.put should throw a TypeError for a null response."
    );
  });

  it("Cache.put with a POST request", async () => {
    const cache = await caches.open("v1");
    const request = new Request(test_url, {
      method: "POST",
      body: test_body(),
    });
    const err = await cache
      .put(request, new Response(test_body()))
      .catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.put should throw a TypeError for a POST request."
    );
  });

  it("Cache.put with a used response body", async () => {
    const cache = await caches.open("v1");
    const response = new Response(test_body());
    console.assert(
      response.bodyUsed === false,
      "[https://fetch.spec.whatwg.org/#dom-body-bodyused] Response.bodyUsed should be initially false."
    );
    await response.text();
    console.assert(
      response.bodyUsed === true,
      "[https://fetch.spec.whatwg.org/#concept-body-consume-body] The text() method should make the body disturbed."
    );
    const request = new Request(test_url);
    const err = await cache.put(request, response).catch((a) => a);
    console.assert(err instanceof TypeError, "Cache.put should be rejected");
  });

  it("Cache.put with a VARY:* Response", async () => {
    const cache = await caches.open("v1");
    const req = new Request(test_url);
    const res = new Response(test_body(), { headers: { VARY: "*" } });
    const err = await cache.put(req, res).catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.put should reject VARY:* Responses with a TypeError."
    );
  });

  it.skip("Cache.put with an embedded VARY:* Response", async () => {
    const cache = await caches.open("v1");
    const req = new Request(test_url);
    const res = new Response(test_body(), {
      headers: { VARY: "Accept-Language,*" },
    });
    const err = await cache.put(req, res).catch((a) => a);
    console.assert(
      err instanceof TypeError,
      "Cache.put should reject Responses with an embedded VARY:* with a TypeError."
    );
  });
});
