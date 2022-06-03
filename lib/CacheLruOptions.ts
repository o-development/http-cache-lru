import { Options } from "lru-cache";
import PolicyResponse from "./PolicyResponse";
import { fetch, Response } from "cross-fetch";

export default interface CacheLruOptions {
  lruOptions?: Options<string, PolicyResponse>;
  fetch?: (
    input: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>;
}

export function applyCacheLruOptionsDefaults(
  options?: CacheLruOptions
): Required<CacheLruOptions> {
  return {
    lruOptions: options?.lruOptions || { max: 100 },
    fetch: options?.fetch || fetch,
  };
}
