import { K8sResourceKind, Patch } from '@console/internal/module/k8s';

type K8sError = K8sGetError | K8sCreateError | K8sPatchError | K8sKillError;
type K8sGetObject = { name: string; namespace: string };

class ErrorWithCause extends Error {
  readonly cause: Error;

  readonly json: any;

  constructor(message: string, cause: Error) {
    super(message);
    this.cause = cause;
    this.json = (cause as any)?.json;
  }
}

export class K8sGetError extends ErrorWithCause {
  readonly failedObject: K8sGetObject;

  constructor(message: string, cause: Error, failedObject: K8sGetObject) {
    super(message, cause);
    this.failedObject = failedObject;
  }
}

export class K8sCreateError extends ErrorWithCause {
  readonly failedObject: K8sResourceKind;

  constructor(message: string, cause: Error, failedObject: K8sResourceKind) {
    super(message, cause);
    this.failedObject = failedObject;
  }
}

export class K8sPatchError extends ErrorWithCause {
  readonly failedObject: K8sResourceKind;

  readonly failedPatches: Patch[];

  constructor(
    message: string,
    cause: Error,
    failedObject: K8sResourceKind,
    failedPatches: Patch[],
  ) {
    super(message, cause);
    this.failedObject = failedObject;
    this.failedPatches = failedPatches;
  }
}

export class K8sKillError extends ErrorWithCause {
  readonly failedObject: K8sResourceKind;

  constructor(message: string, cause: Error, failedObject: K8sResourceKind) {
    super(message, cause);
    this.failedObject = failedObject;
  }
}

export class K8sMultipleErrors extends Error {
  readonly errors: K8sError[];

  constructor(message: string, errors: K8sError[]) {
    super(message);
    this.errors = errors;
  }
}

export class K8sDetailError extends ErrorWithCause {
  readonly title: string;

  readonly detail: string;

  constructor(
    {
      message,
      title = '',
      detail = '',
    }: {
      message: string;
      title?: string;
      detail?: string;
    },
    cause?: Error,
  ) {
    super(message, cause);
    this.title = title;
    this.detail = detail;
  }
}
