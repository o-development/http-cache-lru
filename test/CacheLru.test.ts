import { CacheLru } from "../lib/CacheLru";
import { Request, Response } from "cross-fetch";

/**
 * Define all the mock fetch request and responses here
 */
const fetchOptionsData = {
  plain: {} as FetchOptionData,
  maxAge: {
    responseInit: {
      headers: {
        "cache-control": "max-age=604800",
      },
    },
  } as FetchOptionData,
  eTag: {
    responseInit: {
      headers: {
        etag: "123456",
      },
    },
  } as FetchOptionData,
};

interface FetchOption {
  uri: string;
  request: Request;
  body: string;
  response: Response;
}

interface FetchOptionData {
  requestInit?: RequestInit;
  responseInit?: ResponseInit;
}

type FetchOptions = {
  [key in keyof typeof fetchOptionsData]: FetchOption;
};

describe("CacheLru", () => {
  let fetch: jest.Mock<
    Promise<Response>,
    [input: RequestInfo, init?: RequestInit | undefined]
  >;
  let cacheLru: CacheLru;
  let fo: FetchOptions;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    fo = {};
    Object.entries(fetchOptionsData).forEach(([key, fetchOptionData]) => {
      const uri = `https://example.com/${key}`;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      fo[key] = {
        uri: uri,
        request: new Request(uri, fetchOptionData.requestInit),
        body: key,
        response: new Response(key, fetchOptionData.responseInit),
      };
    });

    fetch = jest.fn(
      async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
        const fetchOption = Object.values(fo).find(
          (option) => option.uri === new Request(input, init).url
        );
        if (!fetchOption) {
          throw Error("Test specified unknown fetch option");
        }
        return fetchOption.response;
      }
    );
    cacheLru = new CacheLru({ fetch });
  });

  describe("put", () => {
    it("puts a response that should be valid", async () => {
      await cacheLru.put(fo.maxAge.request, fo.maxAge.response);
      const cachedResponse = await cacheLru.match(fo.maxAge.request);
      expect(await cachedResponse?.text()).toBe(fo.maxAge.body);
    });

    it("puts a response that should be valid", async () => {
      await cacheLru.put(fo.plain.request, fo.plain.response);
      const cachedResponse = await cacheLru.match(fo.plain.request);
      expect(cachedResponse).toBeUndefined();
    });
  });

  describe("add", () => {
    it("performs a fetch when there is nothing in the cache.", async () => {
      await cacheLru.add(fo.maxAge.request);
      expect(fetch).toHaveBeenCalledWith(fo.maxAge.request);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("does not perform a fetch when the cache is not stale", async () => {
      await cacheLru.add(fo.maxAge.request);
      expect(await (await cacheLru.match(fo.maxAge.request))?.text()).toBe(
        fo.maxAge.body
      );
      await cacheLru.add(fo.maxAge.request);
      expect(fetch).toHaveBeenCalledWith(fo.maxAge.request);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(await (await cacheLru.match(fo.maxAge.request))?.text()).toBe(
        fo.maxAge.body
      );
    });

    it("performs a fetch when the cache is stale", async () => {
      await cacheLru.add(fo.plain.request);
      await cacheLru.add(fo.plain.request);
      expect(fetch).toHaveBeenCalledWith(fo.plain.request);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("makes a request with the proper headers when an etag is present", async () => {
      await cacheLru.add(fo.eTag.request);
      expect(fetch).toHaveBeenCalledWith(fo.eTag.request);
      console.log(await cacheLru.match(fo.eTag.request));
      cacheLru.logCache();
      expect(await (await cacheLru.match(fo.eTag.request))?.text()).toBe(
        fo.eTag.body
      );
      fetch.mockResolvedValueOnce(
        new Response("Distraction Body that should not be set", {
          status: 304,
          headers: {
            etag: "123456",
          },
        })
      );
      await cacheLru.add(fo.eTag.request);
      expect(fetch).toHaveBeenCalledWith(
        new Request(fo.eTag.uri, {
          headers: {
            "if-none-match": "123456",
          },
        })
      );
      expect(await (await cacheLru.match(fo.eTag.request))?.text()).toBe(
        fo.eTag.body
      );
    });
  });
});
