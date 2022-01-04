import * as React from 'react';
import { Card, CardBody, CardHeader, CardTitle, CardActions } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { NodeDashboardContext } from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import NodeRoles from '@console/app/src/components/nodes/NodeRoles';
import { resourcePathFromModel, ResourceLink } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { getNodeAddresses } from '@console/shared/src/selectors/node';
import { BareMetalHostModel } from '../../../models';
import { BareMetalNodeDashboardContext } from './BareMetalNodeDashboardContext';

const DetailsCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(NodeDashboardContext);
  const { host } = React.useContext(BareMetalNodeDashboardContext);
  const detailsLink = `${resourcePathFromModel(NodeModel, obj.metadata.name)}/details`;
  return (
    <Card data-test-id="details-card">
      <CardHeader>
        <CardTitle>{t('metal3-plugin~Details')}</CardTitle>
        <CardActions className="co-overview-card__actions">
          <Link to={detailsLink}>{t('metal3-plugin~View all')}</Link>
        </CardActions>
      </CardHeader>
      <CardBody>
        <DetailsBody>
          <DetailItem isLoading={!obj} title={t('metal3-plugin~Node Name')}>
            {obj.metadata.name}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('metal3-plugin~Role')}>
            <NodeRoles node={obj} />
          </DetailItem>
          <DetailItem isLoading={!host} title={t('metal3-plugin~Bare Metal Host')}>
            <ResourceLink
              kind={referenceForModel(BareMetalHostModel)}
              name={host?.metadata?.name}
              namespace={host?.metadata?.namespace}
            />
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('metal3-plugin~Node Addresses')}>
            <NodeIPList ips={getNodeAddresses(obj)} expand />
          </DetailItem>
        </DetailsBody>
      </CardBody>
    </Card>
  );
};

export default DetailsCard;
