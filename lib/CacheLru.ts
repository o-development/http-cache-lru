import queryCache from "./helpers/queryCache";

Cache;

/**
 * A Cache implementation specifified here https://w3c.github.io/ServiceWorker/#cache-interface
 */
export class CacheLru implements Cache {
  protected type: delete;
  protected requestResponseList: { request: Request; response: Response }[] =
    [];
  protected;

  constructor() {}

  add(request: RequestInfo): Promise<void> {
    throw new Error("Method not implemented.");
  }
  addAll(requests: RequestInfo[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  delete(request: RequestInfo, options?: CacheQueryOptions): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  keys(
    request?: RequestInfo,
    options?: CacheQueryOptions
  ): Promise<readonly Request[]> {
    throw new Error("Method not implemented.");
  }
  /**
   * The match() method of the Cache interface returns a Promise that resolves to the Response associated with the first matching request in the Cache object. If no match is found, the Promise resolves to undefined.
   * @param request The Request for which you are attempting to find responses in the Cache. This can be a Request object or a URL.
   * @param options An object that sets options for the match operation.
   * @returns A Promise that resolves to the first Response that matches the request or to undefined if no match is found.
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
   * The matchAll() method of the Cache interface returns a Promise that resolves to an array of all matching responses in the Cache object.
   * @param request The Request for which you are attempting to find responses in the Cache. This can be a Request object or a URL. If this argument is omitted, you will get a copy of all responses in this cache.
   * @param options An options object allowing you to set specific control options for the matching performed.
   * @returns A Promise that resolves to an array of all matching responses in the Cache object.
   */
  async matchAll(
    request?: RequestInfo,
    options?: CacheQueryOptions
  ): Promise<readonly Response[]> {
    let r: RequestInfo | undefined = undefined;
    if (request) {
      if (typeof request === "object") {
        r = request;
        // Non GET requests should not be cached
        if (r.method.toLocaleLowerCase() !== "get" && !options?.ignoreMethod) {
          return [];
        }
      } else {
        r = new Request(request);
      }
    }
    const responses: Response[] = [];
    if (!r) {
      this.requestResponseList.forEach(({ response }) =>
        responses.push(response)
      );
    } else {
      const requestResponses = queryCache(r, options);
      requestResponses.forEach((requestResponse) => {
        responses.push(requestResponse.response.clone());
      });
      // HACK, The spec says:
      // If response’s type is "opaque" and cross-origin resource policy check with promise’s relevant settings object's origin,
      // promise’s relevant settings object, "", and response’s internal response returns blocked, then reject promise with a
      // TypeError and abort these steps.
      // I decided not to include this step as it steps out of regular JavaScript
      // responses.forEach((response) => {
      //   if (response.type === "opaque"  ...) {
      //   }
      // });

      // HACK, The spec says:
      // Add a new Response object associated with response and a new Headers object whose guard is "immutable" to responseList.
      // But I don't think JavaScript has a access to that capability
      return Object.freeze(responses);
    }
  }

  put(request: RequestInfo, response: Response): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
