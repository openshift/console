import { NodeKind } from '@console/internal/module/k8s';

export const createConfigureUnschedulableModal = (props: { resource: NodeKind }) =>
  import(
    './ConfigureUnschedulableModal' /* webpackChunkName: "configure-unschedulable-modal" */
  ).then((m) => m.default(props));
