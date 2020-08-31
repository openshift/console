import { K8sResourceKind, Patch } from '@console/internal/module/k8s';

type K8sError = K8sGetError | K8sCreateError | K8sPatchError | K8sKillError;
type K8sGetObject = { name: string; namespace: string };

export class K8sGetError extends Error {
  readonly failedObject: K8sGetObject;

  constructor(message: string, failedObject: K8sGetObject) {
    super(message);
    this.failedObject = failedObject;
  }
}

export class K8sCreateError extends Error {
  readonly failedObject: K8sResourceKind;

  constructor(message: string, failedObject: K8sResourceKind) {
    super(message);
    this.failedObject = failedObject;
  }
}

export class K8sPatchError extends Error {
  readonly failedObject: K8sResourceKind;

  readonly failedPatches: Patch[];

  constructor(message: string, failedObject: K8sResourceKind, failedPatches: Patch[]) {
    super(message);
    this.failedObject = failedObject;
    this.failedPatches = failedPatches;
  }
}

export class K8sKillError extends Error {
  readonly failedObject: K8sResourceKind;

  readonly json: any;

  constructor(message: string, json, failedObject: K8sResourceKind) {
    super(message);
    this.json = json;
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

export class K8sDetailError extends Error {
  readonly title: string;

  readonly detail: string;

  constructor({
    message,
    title = '',
    detail = '',
  }: {
    message: string;
    title?: string;
    detail?: string;
  }) {
    super(message);
    this.title = title;
    this.detail = detail;
  }
}
