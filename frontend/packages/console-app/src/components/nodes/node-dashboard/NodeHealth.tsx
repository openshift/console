import * as React from 'react';
import * as _ from 'lodash';
import { Gallery, GalleryItem, Alert } from '@patternfly/react-core';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import {
  HealthState,
  healthStateMapping,
} from '@console/shared/src/components/dashboard/status-card/states';
import { getNodeMachineNameAndNamespace } from '@console/shared';
import { MachineModel, MachineHealthCheckModel } from '@console/internal/models';
import {
  referenceForModel,
  MachineKind,
  NodeKind,
  MachineHealthCheckKind,
  MachineHealthCondition,
} from '@console/internal/module/k8s';
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
import { CONDITIONS_WARNING } from './messages';

import './node-health.scss';

export const HealthChecksPopup: React.FC<HealthChecksPopupProps> = ({
  conditions = [],
  machineHealthChecks,
  disabledAlert,
}) => {
  let conditionFailing: boolean = false;
  let reboot: boolean = false;
  const grouppedConditions = Object.values(
    _.groupBy(
      conditions.sort((a, b) => a.type.localeCompare(b.type)),
      (c) => c.type,
    ),
  ).map((cds) => {
    const failing = cds.some((c) => c.failing);
    if (failing) {
      conditionFailing = true;
      reboot =
        machineHealthChecks?.[0]?.metadata?.annotations?.[
          'machine.openshift.io/remediation-strategy'
        ] === 'external-baremetal';
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
            <Status {...c} key={c.title}>
              {c.title}
            </Status>
          ))}
        </StatusPopupSection>
      )}
      {conditionFailing && (
        <Alert
          variant="warning"
          isInline
          title={`${reboot ? 'Reboot' : 'Reprovision'} pending`}
          className="co-node-health__popup-alert"
        >
          {CONDITIONS_WARNING(reboot)}
        </Alert>
      )}
      {machineHealthChecks?.length > 1 && (
        <Alert
          variant="warning"
          isInline
          title="Multiple resources"
          className="co-node-health__popup-alert"
        >
          {`Only one ${MachineHealthCheckModel.label} resource should match this node.`}
        </Alert>
      )}
      {disabledAlert && (
        <Alert isInline title={disabledAlert.title} className="co-node-health__popup-alert">
          {disabledAlert.message}
        </Alert>
      )}
    </>
  );
};

export const machineHealthChecksResource: WatchK8sResource = {
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

export const getMachineHealth = (
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

type HealthChecksItemProps = {
  disabledAlert?: {
    title: string;
    message: React.ReactNode;
  };
};

export const HealthChecksItem: React.FC<HealthChecksItemProps> = ({ disabledAlert }) => {
  const { obj, setHealthCheck } = React.useContext(NodeDashboardContext);
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
  const healthState = disabledAlert
    ? { state: HealthState.NOT_AVAILABLE }
    : getMachineHealth(obj, machine, healthChecks);

  let failingHealthCheck = false;
  let reboot = false;
  _.forEach(healthState.conditions, (c) => {
    if (c.failing) {
      failingHealthCheck = true;
      reboot =
        healthState.matchingHC?.[0]?.metadata?.annotations?.[
          'machine.openshift.io/remediation-strategy'
        ] === 'external-baremetal';
      return false;
    }
    return true;
  });

  setHealthCheck({
    failingHealthCheck,
    reboot,
  });

  return (
    <HealthItem title="Health Checks" popupTitle="Health Checks" {...healthState}>
      <HealthChecksPopup
        conditions={healthState.conditions}
        machineHealthChecks={healthState.matchingHC}
        disabledAlert={disabledAlert}
      />
    </HealthItem>
  );
};

const NodeHealth: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  return (
    <HealthBody>
      <Gallery className="co-overview-status__health" hasGutter>
        <GalleryItem>
          <NodeStatus node={obj} className="co-node-health__status" />
        </GalleryItem>
        <GalleryItem>
          <HealthChecksItem />
        </GalleryItem>
      </Gallery>
    </HealthBody>
  );
};

export default NodeHealth;

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
  disabledAlert?: {
    title: string;
    message: React.ReactNode;
  };
};
