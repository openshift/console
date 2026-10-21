import type { FC } from 'react';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import KSRoutesOverviewListItem from './KSRoutesOverviewListItem';

type KSRoutesProps = {
  route: K8sResourceKind;
};

const KSRoutes: FC<KSRoutesProps> = ({ route }) => (
  <>
    <KSRoutesOverviewListItem ksroute={route} />
  </>
);

export default KSRoutes;
