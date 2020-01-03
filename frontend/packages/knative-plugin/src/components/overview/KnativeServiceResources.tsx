import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

export type KnativeServiceResourceProps = {
  obj: K8sResourceKind;
  revisions: K8sResourceKind[];
  ksroutes: K8sResourceKind[];
};

const KnativeServiceResources: React.FC<KnativeServiceResourceProps> = ({
  revisions,
  ksroutes,
  obj,
}) => {
  return (
    <>
      <RevisionsOverviewList revisions={revisions} service={obj} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
    </>
  );
};

export default KnativeServiceResources;
