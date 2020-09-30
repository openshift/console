import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import KSRoutesOverviewListItem from './KSRoutesOverviewListItem';

type KSRoutesProps = {
  route: K8sResourceKind;
};

const KSRoutes: React.FC<KSRoutesProps> = ({ route }) => (
  <>
    <KSRoutesOverviewListItem ksroute={route} />
  </>
);

export default KSRoutes;
