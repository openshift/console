import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostKind } from '../../../types';
import BareMetalHostRole from '../BareMetalHostRole';
import NodeLink from '../NodeLink';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const DetailsCard: React.FC<DetailsCardProps> = () => {
  const { t } = useTranslation();
  const { obj, machine, node } = React.useContext(BareMetalHostDashboardContext);
  const hostName = getName(obj);
  const nodeCell = <NodeLink nodeName={getName(node)} />;
  const hostRole = <BareMetalHostRole machine={machine} node={node} />;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('metal3-plugin~Details')}</DashboardCardTitle>
        <DashboardCardLink
          to={`${resourcePathFromModel(
            BareMetalHostModel,
            getName(obj),
            getNamespace(obj),
          )}/details`}
        >
          {t('metal3-plugin~View all')}
        </DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem title={t('metal3-plugin~Host name')} isLoading={false} error={null}>
            {hostName}
          </DetailItem>
          <DetailItem title={t('metal3-plugin~Role')} isLoading={false} error={null}>
            {hostRole}
          </DetailItem>
          <DetailItem title={t('metal3-plugin~Node')} isLoading={false} error={null}>
            {nodeCell}
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default DetailsCard;

type DetailsCardProps = {
  obj: BareMetalHostKind;
  machines: MachineKind[];
  nodes: NodeKind[];
};
