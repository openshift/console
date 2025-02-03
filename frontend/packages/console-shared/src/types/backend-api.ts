export type DevConsoleEndpointRequest = {
  allowAuthHeader?: boolean;
  allowInsecure?: boolean;
};

export type DevConsoleEndpointResponse = {
  statusCode: number;
  headers: Record<string, string[]>;
  body: string;
};
