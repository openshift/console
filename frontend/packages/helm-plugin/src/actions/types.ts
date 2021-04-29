export type HelmActionsScope = {
  releaseName: string;
  namespace: string;
  actionOrigin?: string;
  redirect?: boolean;
};
