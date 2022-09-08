import * as React from 'react';
import { OverviewDetailItem } from '@openshift-console/plugin-shared/src';
import { Card, CardBody, CardHeader, CardTitle, CardActions } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { getNodeAddresses } from '@console/shared/src/selectors/node';
import NodeIPList from '../NodeIPList';
import NodeRoles from '../NodeRoles';
import { NodeDashboardContext } from './NodeDashboardContext';

const DetailsCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const detailsLink = `${resourcePathFromModel(NodeModel, obj.metadata.name)}/details`;
  const instanceType = obj.metadata.labels?.['beta.kubernetes.io/instance-type'];
  const zone = obj.metadata.labels?.['topology.kubernetes.io/zone'];
  const { t } = useTranslation();
  return (
    <Card data-test-id="details-card">
      <CardHeader>
        <CardTitle>{t('console-app~Details')}</CardTitle>
        <CardActions className="co-overview-card__actions">
          <Link to={detailsLink}>{t('console-app~View all')}</Link>
        </CardActions>
      </CardHeader>
      <CardBody>
        <DetailsBody>
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
        </DetailsBody>
      </CardBody>
    </Card>
  );
};

export default DetailsCard;
