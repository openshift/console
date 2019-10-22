import * as React from 'react';
import { K8sResourceKind } from '../../../module/k8s';

export const ProjectDashboardContext = React.createContext<ProjectDashboardContext>({});

type ProjectDashboardContext = {
  obj?: K8sResourceKind;
  namespaceLinks?: K8sResourceKind[];
};
