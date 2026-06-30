import type { FC } from 'react';
import { useMemo, useContext } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  Divider,
  DividerVariant,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import NodeGroupEditButton from '@console/app/src/components/nodes/NodeGroupEditButton';
import { getNodeGroups } from '@console/app/src/components/nodes/utils/NodeGroupUtils';
import { FLAG_NODE_MGMT_V1 } from '@console/app/src/consts';
import { OverviewDetailItem } from '@console/internal/components/overview/OverviewDetailItem';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { NodeModel } from '@console/internal/models';
import { DASH } from '@console/shared/src/constants/ui';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { getNodeAddresses } from '@console/shared/src/selectors/node';
import NodeIPList from '../NodeIPList';
import NodeRoles from '../NodeRoles';
import { NodeDashboardContext } from './NodeDashboardContext';
import NodeUptime from './NodeUptime';

const DetailsCard: FC = () => {
  const { obj } = useContext(NodeDashboardContext);
  const detailsLink = `${resourcePathFromModel(NodeModel, obj.metadata.name)}/details`;
  const instanceType = obj.metadata.labels?.['beta.kubernetes.io/instance-type'];
  const zone = obj.metadata.labels?.['topology.kubernetes.io/zone'];
  const { t } = useTranslation('console-app');
  const nodeMgmtV1Enabled = useFlag(FLAG_NODE_MGMT_V1);

  const nodeGroups = useMemo(() => getNodeGroups(obj).sort().join(', ') || DASH, [obj]);

  return (
    <Card data-test-id="details-card">
      <CardHeader
        actions={{
          actions: (
            <>
              <Link to={detailsLink}>{t('View all')}</Link>
            </>
          ),
          hasNoOffset: false,
          className: 'co-overview-card__actions',
        }}
      >
        <CardTitle>{t('Details')}</CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <OverviewDetailItem isLoading={!obj} title={t('Node name')}>
            {obj.metadata.name}
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('Roles')}>
            <NodeRoles node={obj} />
          </OverviewDetailItem>
          <OverviewDetailItem
            isLoading={!obj}
            title={t('Instance type')}
            error={!instanceType ? t('Not available') : undefined}
          >
            {instanceType}
          </OverviewDetailItem>
          <OverviewDetailItem
            isLoading={!obj}
            title={t('Zone')}
            error={!zone ? t('Not available') : undefined}
          >
            {zone}
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('Node addresses')}>
            <NodeIPList ips={getNodeAddresses(obj)} expand />
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('Uptime')}>
            <NodeUptime obj={obj} />
          </OverviewDetailItem>
          {nodeMgmtV1Enabled ? (
            <>
              <Divider component={DividerVariant.div} className="pf-v6-u-w-75" />
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>
                  <OverviewDetailItem isLoading={!obj} title={t('Groups')}>
                    {nodeGroups}
                  </OverviewDetailItem>
                </FlexItem>
                <FlexItem>
                  <NodeGroupEditButton node={obj} />
                </FlexItem>
              </Flex>
            </>
          ) : null}
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default DetailsCard;
