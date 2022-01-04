import * as React from 'react';
import {
  Gallery,
  GalleryItem,
  Stack,
  StackItem,
  Card,
  CardHeader,
  CardTitle,
} from '@patternfly/react-core';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NodeAlerts from '@console/app/src/components/nodes/node-dashboard/NodeAlerts';
import { NodeDashboardContext } from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import { HealthChecksItem } from '@console/app/src/components/nodes/node-dashboard/NodeHealth';
import { resourcePathFromModel, LoadingInline } from '@console/internal/components/utils';
import { BlueInfoCircleIcon } from '@console/shared';
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
    <Card data-test-id="status-card" className="co-overview-card--gradient">
      <CardHeader>
        <CardTitle>{t('metal3-plugin~Status')}</CardTitle>
      </CardHeader>
      {obj ? (
        <>
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
        </>
      ) : (
        <LoadingInline />
      )}
    </Card>
  );
};

export default StatusCard;
