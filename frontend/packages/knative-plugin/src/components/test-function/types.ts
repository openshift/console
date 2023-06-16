export enum InvokeFormat {
  HTTP = 'HTTP',
  CloudEvent = 'CloudEvent',
}

export enum ModalPanel {
  Request = 'Request',
  Response = 'Response',
}

export type TestFunctionFormikValues = {
  request: {
    format: InvokeFormat;
    contentType: string;
    isAdvancedSettingsExpanded: boolean;
    type: string;
    source: string;
    customHeaders: string[][];
    body: {
      data: string;
    };
  };
  response: {
    status: string;
    statusCode: number;
    header: Record<string, string[]>;
    body: string;
  };
};
