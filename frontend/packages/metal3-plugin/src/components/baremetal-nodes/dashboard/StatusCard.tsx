import * as React from 'react';
import { Gallery, GalleryItem, Stack, StackItem } from '@patternfly/react-core';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NodeAlerts from '@console/app/src/components/nodes/node-dashboard/NodeAlerts';
import { NodeDashboardContext } from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import { HealthChecksItem } from '@console/app/src/components/nodes/node-dashboard/NodeHealth';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BlueInfoCircleIcon } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { StatusItem } from '@console/shared/src/components/dashboard/status-card/AlertItem';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { useFlag } from '@console/shared/src/hooks/flag';
import { BMO_ENABLED_FLAG } from '../../../features';
import { BareMetalHostModel } from '../../../models';
import { hasPowerManagement } from '../../../selectors';
import { bareMetalNodeStatus } from '../../../status/baremetal-node-status';
import { BareMetalHostKind } from '../../../types';
import BareMetalNodeStatus from '../BareMetalNodeStatus';
import { BareMetalNodeDashboardContext } from './BareMetalNodeDashboardContext';

const getDisabledAlert = (
  bmoEnabled: boolean,
  host: BareMetalHostKind,
  hasPowerMgmt: boolean,
  t: TFunction,
) => {
  if (!bmoEnabled) {
    return {
      title: t('metal3-plugin~Bare Metal Operator not available'),
      message: t(
        'metal3-plugin~The Bare Metal Operator that enables this capability is not available or disabled.',
      ),
    };
  }
  if (host && !hasPowerMgmt) {
    return {
      title: t('metal3-plugin~Power management not available'),
      message: (
        <Stack hasGutter>
          <StackItem>
            {t(
              'metal3-plugin~Power operations cannot be performed on this host until Baseboard Management Controller (BMC) credentials are provided for the underlying host.',
            )}
          </StackItem>
          <StackItem>
            <Link
              to={`${resourcePathFromModel(
                BareMetalHostModel,
                host.metadata.name,
                host.metadata.namespace,
              )}/edit?powerMgmt`}
            >
              {t('metal3-plugin~Add credentials')}
            </Link>
          </StackItem>
        </Stack>
      ),
    };
  }
  return undefined;
};

const StatusCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(NodeDashboardContext);
  const { nodeMaintenance, csr, host } = React.useContext(BareMetalNodeDashboardContext);
  const bmoEnabled = useFlag(BMO_ENABLED_FLAG);
  const status = bareMetalNodeStatus({ node: obj, nodeMaintenance, csr });
  const hasPowerMgmt = hasPowerManagement(host);

  return (
    <DashboardCard gradient data-test-id="status-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('metal3-plugin~Status')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={!obj}>
        <HealthBody>
          <Gallery className="co-overview-status__health" hasGutter>
            <GalleryItem>
              <BareMetalNodeStatus
                {...status}
                nodeMaintenance={nodeMaintenance}
                className="co-node-health__status"
                csr={csr}
              />
            </GalleryItem>
            <GalleryItem>
              <HealthChecksItem
                disabledAlert={getDisabledAlert(bmoEnabled, host, hasPowerMgmt, t)}
              />
            </GalleryItem>
          </Gallery>
        </HealthBody>
        <NodeAlerts>
          {host && !hasPowerMgmt && (
            <StatusItem
              Icon={BlueInfoCircleIcon}
              message={t(
                'metal3-plugin~Power operations cannot be performed on this host until Baseboard Management Controller (BMC) credentials are provided for the underlying host.',
              )}
            >
              <Link
                to={`${resourcePathFromModel(
                  BareMetalHostModel,
                  host.metadata.name,
                  host.metadata.namespace,
                )}/edit?powerMgmt`}
              >
                {t('metal3-plugin~Add credentials')}
              </Link>
            </StatusItem>
          )}
        </NodeAlerts>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default StatusCard;
