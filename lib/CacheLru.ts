import LRU, { Options } from "lru-cache";
import CachePolicy from "http-cache-semantics";
import defaultLruOptions from "./defaultLruOptions";
import PolicyResponse from "./PolicyResponse";
import { Request, Response, Headers, fetch } from "cross-fetch";

/**
 * A Cache implementation specifified here
 * https://w3c.github.io/ServiceWorker/#cache-interface
 */
export class CacheLru implements Cache {
  private cache: LRU<string, PolicyResponse>;

  constructor(lruOptions: Options<string, PolicyResponse> = defaultLruOptions) {
    this.cache = new LRU(lruOptions);
  }

  /**
   * The add() method of the Cache interface takes a URL, retrieves it, and adds
   * the resulting response object to the given cache.
   * @param request The request you want to add to the cache. This can be a
   * Request object or a URL.
   */
  add(request: RequestInfo): Promise<void> {
    return this.addAll([request]);
  }

  /**
   * The addAll() method of the Cache interface takes an array of URLs,
   * retrieves them, and adds the resulting response objects to the given cache.
   * The request objects created during retrieval become keys to the stored
   * response operations.
   * @param requests An array of string URLs that you want to be fetched and
   * added to the cache. You can specify the Request object instead of the URL.
   */
  async addAll(requests: RequestInfo[]): Promise<void> {
    if (requests.some((request) => new Request(request).method !== "GET")) {
      throw new TypeError(`Request must have method "GET"`);
    }
    await Promise.all(
      requests.map(async (request) => {
        const response = await fetch(request);
        if (
          response.status < 200 ||
          response.status > 299 ||
          response.status === 206
        ) {
          throw new TypeError(
            `Cannot cache. Server responded with ${response.status}`
          );
        }
        await this.put(request, response);
      })
    );
  }

  /**
   * The delete() method of the Cache interface finds the Cache entry whose key
   * is the request, and if found, deletes the Cache entry and returns a Promise
   * that resolves to true. If no Cache entry is found, it resolves to false.
   * @param request The Request you are looking to delete. This can be a Request
   * object or a URL.
   * @param options An object whose properties control how matching is done in
   * the delete operation.
   * @returns a Promise that resolves to true if the cache entry is deleted, or
   * false otherwise.
   */
  async delete(
    requestInfo: RequestInfo,
    _options?: CacheQueryOptions
  ): Promise<boolean> {
    return this.cache.delete(new Request(requestInfo).url);
  }

  /**
   * The keys() method of the Cache interface returns a Promise that resolves to
   * an array ofRequest objects representing the keys of the Cache.
   * @param request The Request want to return, if a specific key is desired.
   * This can be a Request object or a URL.
   * @param options An object whose properties control how matching is done in
   * the keys operation.
   * @returns A Promise that resolves to an array of Request objects.
   */
  async keys(
    requestInfo?: RequestInfo,
    options?: CacheQueryOptions
  ): Promise<readonly Request[]> {
    return (await this.matchRequestAndResponse(requestInfo, options)).map(
      ([request]) => request
    );
  }
  /**
   * The match() method of the Cache interface returns a Promise that resolves
   * to the Response associated with the first matching request in the Cache
   * object. If no match is found, the Promise resolves to undefined.
   * @param request The Request for which you are attempting to find responses
   * in the Cache. This can be a Request object or a URL.
   * @param options An object that sets options for the match operation.
   * @returns A Promise that resolves to the first Response that matches the
   * request or to undefined if no match is found.
   */
  async match(
    request: RequestInfo,
    options?: CacheQueryOptions
  ): Promise<Response | undefined> {
    const matchAllResponse = await this.matchAll(request, options);
    if (matchAllResponse.length === 0) {
      return undefined;
    }
    return matchAllResponse[0];
  }

  /**
   * The matchAll() method of the Cache interface returns a Promise that
   * resolves to an array of all matching responses in the Cache object.
   * @param request The Request for which you are attempting to find responses
   * in the Cache. This can be a Request object or a URL. If this argument is
   * omitted, you will get a copy of all responses in this cache.
   * @param options An options object allowing you to set specific control
   * options for the matching performed.
   * @returns A Promise that resolves to an array of all matching responses in
   * the Cache object.
   */
  async matchAll(
    requestInfo?: RequestInfo,
    options?: CacheQueryOptions
  ): Promise<readonly Response[]> {
    return (await this.matchRequestAndResponse(requestInfo, options)).map(
      ([, response]) => response
    );
  }

  /**
   * The put() method of the Cache interface allows key/value pairs to be added
   * to the current Cache object.
   * @param request The Request object or URL that you want to add to the cache.
   * @param response The Response you want to match up to the request.
   */
  async put(requestInfo: RequestInfo, response: Response): Promise<void> {
    const request = new Request(requestInfo);
    // Headers need to be converted to a hash because http-cache-semantics was
    // built for an older version of headers.
    const requestWithHashHeaders =
      CacheLru.requestToRequestWithHashHeaders(request);
    const responseWithHashHeaders =
      CacheLru.responseToRequestWithHashHeaders(response);
    const policy = new CachePolicy(
      requestWithHashHeaders,
      responseWithHashHeaders
    );
    if (!policy.storable()) {
      throw new TypeError(`${request.url} is not storable.`);
    }
    // Set the cache
    this.cache.set(
      request.url,
      { policy, response },
      { ttl: policy.timeToLive() }
    );
  }

  /**
   * A helper function that takes the values provided as input for the keys and
   * match functions and returns both the Request and Response
   */
  private async matchRequestAndResponse(
    requestInfo?: RequestInfo,
    options?: CacheQueryOptions
  ): Promise<[Request, Response][]> {
    const requests = requestInfo
      ? [new Request(requestInfo)]
      : Array.from(this.cache.keys()).map((key) => new Request(key));
    return (
      await Promise.all(
        requests.map(async (request) => {
          return this.getValidFromCache(request, options);
        })
      )
    ).filter(Boolean) as [Request, Response][];
  }

  /**
   * A helper method that will check if a request exists in the cache and if it
   * does, checks if it is still valid. If it is, it will check if the request
   * is still valid.
   * @param request
   * @param options
   */
  private async getValidFromCache(
    request: Request,
    _options?: CacheQueryOptions
  ): Promise<[Request, Response] | undefined> {
    const requestWithHashHeaders =
      CacheLru.requestToRequestWithHashHeaders(request);
    const cacheResult = this.cache.get(request.url);
    if (cacheResult) {
      const { policy, response } = cacheResult;
      const isSatisfied = policy.satisfiesWithoutRevalidation(
        requestWithHashHeaders
      );
      if (isSatisfied) {
        const newResponse = new Response(response.body, {
          ...response,
          headers: new Headers(
            policy.responseHeaders() as Record<string, string>
          ),
        });
        return [request, newResponse];
      }
    }
    return undefined;
  }

  /**
   * Convert a request into the old version of the request that doesn't use the
   * Headers object
   * @param request the request
   * @returns A request that has hash header
   */
  public static requestToRequestWithHashHeaders(request: Request) {
    return { ...request, headers: CacheLru.headersToHash(request.headers) };
  }

  /**
   * Convert a response into the old version of the response that doesn't use
   * the Headers object
   * @param response the response
   * @returns A response that has hash header
   */
  public static responseToRequestWithHashHeaders(response: Response) {
    return { ...response, headers: CacheLru.headersToHash(response.headers) };
  }

  /**
   * Convert the given headers object into a raw hash.
   * @param headers A headers object.
   */
  public static headersToHash(headers: Headers): Record<string, string> {
    const hash: Record<string, string> = {};
    headers.forEach((value, key) => {
      hash[key] = value;
    });
    return hash;
  }
}
