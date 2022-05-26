import CachePolicy from "http-cache-semantics";

export default interface PolicyResponse {
  policy: CachePolicy;
  response: Response;
}
