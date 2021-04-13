import { K8sKind } from '@console/internal/module/k8s';

export type MenuAction = {
  label?: string; // omit for t(model.labelKey), which fallbacks to model.label if labelKey is unavailable
  model?: K8sKind;
  onSelection?: (key: string, thisAction: MenuAction, currentURL: string) => string | undefined;
};

export type MenuActions = { [key: string]: MenuAction };
