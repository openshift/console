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
