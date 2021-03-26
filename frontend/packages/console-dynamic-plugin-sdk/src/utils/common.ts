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

// TODO: remove this, this type is being used to avoid a JSON schema compilation error.
export type ExtensionsK8sKind = {
  abbr: string;
  kind: string;
  label: string;
  labelKey?: string;
  labelPlural: string;
  labelPluralKey?: string;
  plural: string;
  propagationPolicy?: 'Foreground' | 'Background';

  id?: string;
  crd?: boolean;
  apiVersion: string;
  apiGroup?: string;
  namespaced?: boolean;
  selector?: Selector;
  labels?: { [key: string]: string };
  annotations?: { [key: string]: string };
  verbs?: ExtensionK8sVerb[];
  shortNames?: string[];
  color?: string;
  legacyPluralURL?: boolean;
};

export type MatchExpression = {
  key: string;
  operator: 'Exists' | 'DoesNotExist' | 'In' | 'NotIn' | 'Equals' | 'NotEqual';
  values?: string[];
  value?: string;
};

export type MatchLabels = {
  [key: string]: string;
};

export type Selector = {
  matchLabels?: MatchLabels;
  matchExpressions?: MatchExpression[];
};
