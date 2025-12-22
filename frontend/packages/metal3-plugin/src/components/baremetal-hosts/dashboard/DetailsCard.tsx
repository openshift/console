import type { FC } from 'react';
import { useContext } from 'react';
import { OverviewDetailItem } from '@openshift-console/plugin-shared/src';
import { Card, CardBody, CardHeader, CardTitle, DescriptionList } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostKind } from '../../../types';
import BareMetalHostRole from '../BareMetalHostRole';
import NodeLink from '../NodeLink';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const DetailsCard: FC<DetailsCardProps> = () => {
  const { t } = useTranslation();
  const { obj, machine, node } = useContext(BareMetalHostDashboardContext);
  const hostName = getName(obj);
  const nodeCell = <NodeLink nodeName={getName(node)} />;
  const hostRole = <BareMetalHostRole machine={machine} node={node} />;

  return (
    <Card>
      <CardHeader
        actions={{
          actions: (
            <>
              <Link
                to={`${resourcePathFromModel(
                  BareMetalHostModel,
                  getName(obj),
                  getNamespace(obj),
                )}/details`}
              >
                {t('metal3-plugin~View all')}
              </Link>
            </>
          ),
          hasNoOffset: false,
          className: 'co-overview-card__actions',
        }}
      >
        <CardTitle>{t('metal3-plugin~Details')}</CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <OverviewDetailItem title={t('metal3-plugin~Host name')} isLoading={false}>
            {hostName}
          </OverviewDetailItem>
          <OverviewDetailItem title={t('metal3-plugin~Role')} isLoading={false}>
            {hostRole}
          </OverviewDetailItem>
          <OverviewDetailItem title={t('metal3-plugin~Node')} isLoading={false}>
            {nodeCell}
          </OverviewDetailItem>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default DetailsCard;

type DetailsCardProps = {
  obj: BareMetalHostKind;
  machines: MachineKind[];
  nodes: NodeKind[];
};
