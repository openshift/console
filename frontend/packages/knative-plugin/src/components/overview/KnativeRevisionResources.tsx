import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

export type KnativeRevisionResourceProps = {
  ksroutes: K8sResourceKind[];
  configurations: K8sResourceKind[];
  obj: K8sResourceKind;
};

const KnativeRevisionResources: React.FC<KnativeRevisionResourceProps> = ({
  ksroutes,
  configurations,
  obj,
}) => {
  return (
    <>
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
      <ConfigurationsOverviewList configurations={configurations} />
    </>
  );
};

export default KnativeRevisionResources;
