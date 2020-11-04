import { K8sKind } from '@console/internal/module/k8s';

export type MenuAction = {
  label?: string;
  model?: K8sKind;
  onSelection?: (key: string, thisAction: MenuAction, currentURL: string) => string | undefined;
};

export type MenuActions = { [key: string]: MenuAction };
