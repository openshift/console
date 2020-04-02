import * as React from 'react';
import * as _ from 'lodash';
import { Gallery, GalleryItem, Alert } from '@patternfly/react-core';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import {
  HealthState,
  healthStateMapping,
} from '@console/shared/src/components/dashboard/status-card/states';
import { getNodeMachineNameAndNamespace } from '@console/shared';
import { MachineModel, MachineHealthCheckModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import {
  MachineKind,
  NodeKind,
  MachineHealthCheckKind,
  MachineHealthCondition,
} from '@console/internal/module/k8s/types';
import {
  useK8sWatchResource,
  WatchK8sResult,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { pluralize } from '@console/internal/components/utils/details-page';
import { LabelSelector } from '@console/internal/module/k8s/label-selector';
import Status, {
  StatusPopupSection,
} from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import { ResourceLink } from '@console/internal/components/utils';

import { NodeDashboardContext } from './NodeDashboardContext';
import NodeStatus from '../NodeStatus';

import './status-card.scss';

const CONDITIONS_WARNING =
  'One or more health check remediation conditions have been met. The node will restart automatically.';

const HealthChecksPopup: React.FC<HealthChecksPopupProps> = ({
  conditions = [],
  machineHealthChecks,
}) => {
  let showRestart: boolean = false;
  const grouppedConditions = Object.values(
    _.groupBy(
      conditions.sort((a, b) => a.type.localeCompare(b.type)),
      (c) => c.type,
    ),
  ).map((cds) => {
    const failing = cds.some((c) => c.failing);
    if (failing) {
      showRestart = true;
    }
    return {
      title: cds[0].type,
      value: failing ? 'Failing' : 'Okay',
      icon: failing
        ? healthStateMapping[HealthState.WARNING].icon
        : healthStateMapping[HealthState.OK].icon,
    };
  });
  return (
    <>
      {`${MachineHealthCheckModel.labelPlural} automatically remediate node health issues.`}
      {!!machineHealthChecks?.length && (
        <StatusPopupSection
          firstColumn={pluralize(
            machineHealthChecks.length,
            MachineHealthCheckModel.label,
            MachineHealthCheckModel.labelPlural,
            false,
          )}
        >
          {machineHealthChecks.map(({ metadata }) => (
            <Status key={metadata.uid}>
              <ResourceLink
                kind={referenceForModel(MachineHealthCheckModel)}
                name={metadata.name}
                namespace={metadata.namespace}
                className="co-status-popup__title"
              />
            </Status>
          ))}
        </StatusPopupSection>
      )}
      {!!conditions.length && (
        <StatusPopupSection firstColumn="Conditions" secondColumn="Status">
          {grouppedConditions.map((c) => (
            <Status {...c} key={c.title} />
          ))}
        </StatusPopupSection>
      )}
      {showRestart && (
        <Alert
          variant="warning"
          isInline
          title="Restart pending"
          className="co-node-status__popup-alert"
        >
          {CONDITIONS_WARNING}
        </Alert>
      )}
      {machineHealthChecks?.length > 1 && (
        <Alert
          variant="warning"
          isInline
          title="Multiple resources"
          className="co-node-status__popup-alert"
        >
          {`Only one ${MachineHealthCheckModel.label} resource should match this node.`}
        </Alert>
      )}
    </>
  );
};

const machineHealthChecksResource: WatchK8sResource = {
  isList: true,
  kind: referenceForModel(MachineHealthCheckModel),
};

const isConditionFailing = (
  node: NodeKind,
  { type, status, timeout }: MachineHealthCondition,
): boolean => {
  const nodeCondition = node.status.conditions.find((c) => c.type === type && c.status === status);
  if (!nodeCondition) {
    return false;
  }
  const transitionTime = new Date(nodeCondition.lastTransitionTime).getTime();
  const currentTime = new Date().getTime();
  const withTO = transitionTime + 1000 * parseInt(timeout, 10);
  return withTO < currentTime;
};

const getMachineHealth = (
  node: NodeKind,
  machine: WatchK8sResult<MachineKind>,
  healthChecks: WatchK8sResult<MachineHealthCheckKind[]>,
): MachineHealth => {
  const [mData, mLoaded, mLoadError] = machine;
  const [hcData, hcLoaded, hcLoadError] = healthChecks;
  if (mLoadError || hcLoadError) {
    return {
      state: HealthState.NOT_AVAILABLE,
    };
  }
  if (!mLoaded || !hcLoaded) {
    return {
      state: HealthState.LOADING,
    };
  }
  const matchingHC = hcData.filter((hc) => {
    const selector = new LabelSelector(hc.spec?.selector || {});
    return selector.matches(mData);
  });
  if (!matchingHC.length) {
    return {
      state: HealthState.NOT_AVAILABLE,
      noIcon: true,
      details: 'Not configured',
    };
  }
  let failingConditions: number = 0;
  const conditions = _.flatten(
    matchingHC.map((hc) =>
      hc.spec.unhealthyConditions.map((c) => {
        const failing = isConditionFailing(node, c);
        if (failing) {
          failingConditions++;
        }
        return {
          ...c,
          failing,
        };
      }),
    ),
  );
  return {
    state: failingConditions || matchingHC.length > 1 ? HealthState.WARNING : HealthState.OK,
    details:
      matchingHC.length > 1
        ? 'Multiple resources'
        : failingConditions
        ? `${pluralize(failingConditions, 'condition')} failing`
        : `${pluralize(conditions.length, 'condition')} passing`,
    conditions,
    matchingHC,
  };
};

const HealthChecksItem: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const { name, namespace } = getNodeMachineNameAndNamespace(obj);
  const machineResource = React.useMemo(
    () => ({
      kind: referenceForModel(MachineModel),
      name,
      namespace,
    }),
    [name, namespace],
  );
  const machine = useK8sWatchResource<MachineKind>(machineResource);
  const healthChecks = useK8sWatchResource<MachineHealthCheckKind[]>(machineHealthChecksResource);
  const healthState = getMachineHealth(obj, machine, healthChecks);

  return (
    <HealthItem
      title="Health Checks"
      popupTitle="Health Checks"
      PopupComponent={() => (
        <HealthChecksPopup
          conditions={healthState.conditions}
          machineHealthChecks={healthState.matchingHC}
        />
      )}
      {...healthState}
    />
  );
};

const StatusCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  return (
    <DashboardCard gradient data-test-id="status-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={!obj}>
        <HealthBody>
          <Gallery className="co-overview-status__health" gutter="md">
            <GalleryItem>
              <NodeStatus node={obj} className="co-node-status__health" />
            </GalleryItem>
            <GalleryItem>
              <HealthChecksItem />
            </GalleryItem>
          </Gallery>
        </HealthBody>
        <AlertsBody isLoading={false} error={false} emptyMessage="No node messages" />
      </DashboardCardBody>
    </DashboardCard>
  );
};

type MachineHealthConditionWithStatus = MachineHealthCondition & {
  failing: boolean;
};

type MachineHealth = {
  state: HealthState;
  details?: string;
  noIcon?: boolean;
  conditions?: MachineHealthConditionWithStatus[];
  matchingHC?: MachineHealthCheckKind[];
};

type HealthChecksPopupProps = {
  conditions: MachineHealthConditionWithStatus[];
  machineHealthChecks: MachineHealthCheckKind[];
};

export default StatusCard;
