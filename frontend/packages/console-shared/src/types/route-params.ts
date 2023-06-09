export type RouteParams<P extends string> = {
  [K in P]?: string;
};
