import { K8sResourceKind } from '@console/internal/module/k8s';

export enum HistoryType {
  GET = 'GET',
  UPDATE = 'UPDATE',
  CREATE = 'CREATE',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  NOT_FOUND = 'NOT_FOUND',
}

export class HistoryItem {
  readonly object: K8sResourceKind;

  readonly type: HistoryType;

  constructor(type: HistoryType, object: K8sResourceKind) {
    this.type = type;
    this.object = object;
  }
}

export enum ResultContentType {
  YAML = 'YAML',
  JSON = 'JSON',
  Other = 'Other',
}

export type Result = {
  title: string;
  content: {
    data: any;
    type: ResultContentType;
  };
  isError: boolean;
};

export type ResultsWrapper = {
  isFatal: boolean;
  isValid: boolean;
  requestResults: Result[];
  errors: Result[];
  mainError: {
    title?: string;
    message: string;
    detail?: string;
  };
};
