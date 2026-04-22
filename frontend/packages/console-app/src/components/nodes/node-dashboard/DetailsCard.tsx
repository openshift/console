import type { FC } from 'react';
import { useContext } from 'react';
import {
  Button,
  ButtonVariant,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  Divider,
  DividerVariant,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getNodeGroups } from '@console/app/src/components/nodes/utils/NodeGroupUtils';
import { FLAG_NODE_MGMT_V1 } from '@console/app/src/consts';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src/api/dynamic-core-api';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { OverviewDetailItem } from '@console/internal/components/overview/OverviewDetailItem';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { NodeModel } from '@console/internal/models';
import { DASH } from '@console/shared/src/constants';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { getNodeAddresses } from '@console/shared/src/selectors/node';
import NodeGroupsEditorModal from '../modals/NodeGroupsEditorModal';
import NodeIPList from '../NodeIPList';
import NodeRoles from '../NodeRoles';
import { NodeDashboardContext } from './NodeDashboardContext';
import NodeUptime from './NodeUptime';

const DetailsCard: FC = () => {
  const { obj } = useContext(NodeDashboardContext);
  const detailsLink = `${resourcePathFromModel(NodeModel, obj.metadata.name)}/details`;
  const instanceType = obj.metadata.labels?.['beta.kubernetes.io/instance-type'];
  const zone = obj.metadata.labels?.['topology.kubernetes.io/zone'];
  const { t } = useTranslation();
  const launchOverlay = useOverlay();
  const nodeMgmtV1Enabled = useFlag(FLAG_NODE_MGMT_V1);

  const [canEdit, isEditLoading] = useAccessReview({
    group: NodeModel.apiGroup || '',
    resource: NodeModel.plural,
    verb: 'patch',
  });

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
          {nodeMgmtV1Enabled ? (
            <>
              <Divider component={DividerVariant.div} className="pf-v6-u-w-75" />
              <DescriptionListGroup>
                <dt className="pf-v6-c-description-list__term" data-test="detail-item-title">
                  <span className="pf-v6-c-description-list__text pf-v6-u-w-100">
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                      <FlexItem>{t('console-app~Groups')}</FlexItem>
                      {!isEditLoading && canEdit ? (
                        <FlexItem>
                          <Button
                            variant={ButtonVariant.link}
                            isInline
                            onClick={() => launchOverlay(NodeGroupsEditorModal, { node: obj })}
                          >
                            {t('console-app~Edit')}
                          </Button>
                        </FlexItem>
                      ) : null}
                    </Flex>
                  </span>
                </dt>
                <DescriptionListDescription data-test="detail-item-value">
                  {getNodeGroups(obj).sort().join(', ') || DASH}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </>
          ) : null}
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default DetailsCard;
