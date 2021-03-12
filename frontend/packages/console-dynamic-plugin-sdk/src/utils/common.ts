// TODO: remove this, this type is being used to avoid a JSON schema compilation error.
export type ExtensionCommonK8sResource = {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    ownerReferences?: {
      name: string;
      kind: string;
      apiVersion: string;
    }[];
  };
};

// TODO: remove this, this type is being used to avoid a JSON schema compilation error.
export type ExtensionAccessReviewResourceAttributes = {
  group?: string;
  resource?: string;
  subresource?: string;
  verb?: ExtensionK8sVerb;
  name?: string;
  namespace?: string;
};

// TODO: remove this, this type is being used to avoid a JSON schema compilation error.
export type ExtensionK8sVerb =
  | 'create'
  | 'get'
  | 'list'
  | 'update'
  | 'patch'
  | 'delete'
  | 'deletecollection'
  | 'watch';
