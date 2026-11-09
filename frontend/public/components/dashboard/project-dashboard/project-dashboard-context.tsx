import { createContext } from 'react';
import type { K8sResourceKind } from '../../../module/k8s';

export const ProjectDashboardContext = createContext<ProjectDashboardContext>({});

type ProjectDashboardContext = {
  obj?: K8sResourceKind;
  namespaceLinks?: K8sResourceKind[];
};
