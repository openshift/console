import { createContext } from 'react';
import { K8sResourceKind } from '../../../module/k8s';

export const ProjectDashboardContext = createContext<ProjectDashboardContext>({});

// eslint-disable-next-line no-redeclare
type ProjectDashboardContext = {
  obj?: K8sResourceKind;
  namespaceLinks?: K8sResourceKind[];
};
