import * as React from 'react';
import { Gallery, GalleryItem, Alert, Stack, StackItem } from '@patternfly/react-core';
import i18next from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { WatchK8sResource, WatchK8sResult } from '@console/dynamic-plugin-sdk';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ResourceLink } from '@console/internal/components/utils';
import { pluralize } from '@console/internal/components/utils/details-page';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { MachineModel, MachineHealthCheckModel } from '@console/internal/models';
import {
  referenceForModel,
  MachineKind,
  NodeKind,
  MachineHealthCheckKind,
  MachineHealthCondition,
} from '@console/internal/module/k8s';
import { LabelSelector } from '@console/internal/module/k8s/label-selector';
import { getNodeMachineNameAndNamespace } from '@console/shared';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import {
  HealthState,
  healthStateMapping,
} from '@console/shared/src/components/dashboard/status-card/states';
import Status, {
  StatusPopupSection,
} from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import NodeStatus from '../NodeStatus';
import { CONDITIONS_WARNING } from './messages';
import { NodeDashboardContext } from './NodeDashboardContext';

import './node-health.scss';

export const HealthChecksPopup: React.FC<HealthChecksPopupProps> = ({
  conditions = [],
  machineHealthChecks,
  disabledAlert,
}) => {
  let conditionFailing: boolean = false;
  let reboot: boolean = false;
  const groupedConditions = Object.values(
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
  const { t } = useTranslation();
  return (
    <Stack hasGutter>
      <StackItem>
        {t(
          'console-app~{{ machineHealthCheckLabelPlural }} automatically remediate node health issues.',
          {
            machineHealthCheckLabelPlural: MachineHealthCheckModel.labelPlural,
          },
        )}
      </StackItem>
      {!!machineHealthChecks?.length && (
        <StackItem>
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
        </StackItem>
      )}
      {!!conditions.length && (
        <StackItem>
          <StatusPopupSection
            firstColumn={t('console-app~Conditions')}
            secondColumn={t('console-app~Status')}
          >
            {groupedConditions.map((c) => (
              <Status {...c} key={c.title}>
                {c.title}
              </Status>
            ))}
          </StatusPopupSection>
        </StackItem>
      )}
      {conditionFailing && (
        <StackItem>
          <Alert
            variant="warning"
            isInline
            title={reboot ? t('console-app~Reboot pending') : t('console-app~Reprovision pending')}
            className="co-node-health__popup-alert"
          >
            {CONDITIONS_WARNING(reboot)}
          </Alert>
        </StackItem>
      )}
      {machineHealthChecks?.length > 1 && (
        <StackItem>
          <Alert
            variant="warning"
            isInline
            title="Multiple resources"
            className="co-node-health__popup-alert"
          >
            {t(
              'console-app~Only one {{ machineHealthCheckLabel }} resource should match this node.',
              {
                machineHealthCheckLabel: MachineHealthCheckModel.label,
              },
            )}
          </Alert>
        </StackItem>
      )}
      {disabledAlert && (
        <StackItem>
          <Alert isInline title={disabledAlert.title} className="co-node-health__popup-alert">
            {disabledAlert.message}
          </Alert>
        </StackItem>
      )}
    </Stack>
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
      details: i18next.t('console-app~Not configured'),
    };
  }
  let failingConditions: number = 0;
  const conditions = _.flatten(
    matchingHC.map(
      (hc) =>
        hc.spec?.unhealthyConditions?.map((c) => {
          const failing = isConditionFailing(node, c);
          if (failing) {
            failingConditions++;
          }
          return {
            ...c,
            failing,
          };
        }) ?? [],
    ),
  );

  return {
    state:
      failingConditions || matchingHC.length > 1 || conditions.length === 0
        ? HealthState.WARNING
        : HealthState.OK,
    details:
      matchingHC.length > 1
        ? 'Multiple resources'
        : failingConditions
        ? `${pluralize(failingConditions, 'condition')} failing`
        : conditions.length > 0
        ? `${pluralize(conditions.length, 'condition')} passing`
        : i18next.t('console-app~No conditions'),
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
  const { t } = useTranslation();
  const machine = useK8sWatchResource<MachineKind>(
    name && namespace
      ? {
          groupVersionKind: getGroupVersionKindForModel(MachineModel),
          name,
          namespace,
        }
      : undefined,
  );
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
    <HealthItem
      title={t('console-app~Health checks')}
      popupTitle={t('console-app~Health checks')}
      {...healthState}
    >
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
          <NodeStatus className="co-node-health__status" node={obj} />
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
