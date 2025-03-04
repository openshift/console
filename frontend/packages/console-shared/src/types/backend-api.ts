export type DevConsoleEndpointRequest = {
  allowAuthHeader?: boolean;
};

export type DevConsoleEndpointResponse = {
  statusCode: number;
  headers: Record<string, string[]>;
  body: string;
};
