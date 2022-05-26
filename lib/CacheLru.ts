import queryCache from "./helpers/queryCache";

Cache;

/**
 * A Cache implementation specifified here https://w3c.github.io/ServiceWorker/#cache-interface
 */
export class CacheLru implements Cache {
  protected requestResponseList: { request: Request; response: Response }[] =
    [];

  /**
   * The add() method of the Cache interface takes a URL, retrieves it, and adds the resulting response object to the given cache.
   * @param request The request you want to add to the cache. This can be a Request object or a URL.
   */
  add(request: RequestInfo): Promise<void> {
    return this.addAll([request]);
  }

  /**
   * The addAll() method of the Cache interface takes an array of URLs, retrieves them, and adds the resulting response objects to the given cache. The request objects created during retrieval become keys to the stored response operations.
   * @param requests An array of string URLs that you want to be fetched and added to the cache. You can specify the Request object instead of the URL.
   */
  async addAll(requests: RequestInfo[]): Promise<void> {
    // 2
    const requestList: Request[] = [];
    // 3 and 4
    await Promise.all(
      requests.map(async (request) => {
        // 4.1
        const r = new Request(request);
        // 3.2 and 4.2
        const scheme = new URL(r.url).protocol;
        if (
          !(scheme === "http:" || scheme === "https:") ||
          r.method.toLocaleLowerCase() !== "get"
        ) {
          throw new TypeError(
            "A request much have the scheme http or https and the method must be GET."
          );
        }
        // HACK: Skip 4.3
        // HACK: Skip 4.4
        // 4.5
        requestList.push(r);
        // 4.7
        const response = await fetch(r);
        // 4.7.1
        if (
          response.type === "error" ||
          response.status < 200 ||
          response.status > 299 ||
          response.status === 206
        ) {
          throw new TypeError(
            `Server responded with status ${response.status}`
          );
          // 4.7.2
        } else if (response.headers.has("Vary")) {
          // 4.7.2.1
          const fieldValues = response.headers.get("Vary");

        }
      })
    );
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
      const requestResponses = queryCache(r, options, this.requestResponseList);
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
