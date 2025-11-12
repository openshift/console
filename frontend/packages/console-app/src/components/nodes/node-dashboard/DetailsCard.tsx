import * as React from 'react';
import { OverviewDetailItem } from '@openshift-console/plugin-shared/src';
import { Card, CardBody, CardHeader, CardTitle, DescriptionList } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { NodeModel } from '@console/internal/models';
import { getNodeAddresses } from '@console/shared/src/selectors/node';
import NodeIPList from '../NodeIPList';
import NodeRoles from '../NodeRoles';
import { NodeDashboardContext } from './NodeDashboardContext';
import NodeUptime from './NodeUptime';

const DetailsCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const detailsLink = `${resourcePathFromModel(NodeModel, obj.metadata.name)}/details`;
  const instanceType = obj.metadata.labels?.['beta.kubernetes.io/instance-type'];
  const zone = obj.metadata.labels?.['topology.kubernetes.io/zone'];
  const { t } = useTranslation();
  return (
    <Card data-test-id="details-card">
      <CardHeader
        actions={{
          actions: (
            <>
              <Link to={detailsLink}>{t('console-app~View all')}</Link>
            </>
          ),
          hasNoOffset: false,
          className: 'co-overview-card__actions',
        }}
      >
        <CardTitle>{t('console-app~Details')}</CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <OverviewDetailItem isLoading={!obj} title={t('console-app~Node name')}>
            {obj.metadata.name}
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('console-app~Roles')}>
            <NodeRoles node={obj} />
          </OverviewDetailItem>
          <OverviewDetailItem
            isLoading={!obj}
            title={t('console-app~Instance type')}
            error={!instanceType ? t('console-app~Not available') : undefined}
          >
            {instanceType}
          </OverviewDetailItem>
          <OverviewDetailItem
            isLoading={!obj}
            title={t('console-app~Zone')}
            error={!zone ? t('console-app~Not available') : undefined}
          >
            {zone}
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('console-app~Node addresses')}>
            <NodeIPList ips={getNodeAddresses(obj)} expand />
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('console-app~Uptime')}>
            <NodeUptime obj={obj} />
          </OverviewDetailItem>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default DetailsCard;
