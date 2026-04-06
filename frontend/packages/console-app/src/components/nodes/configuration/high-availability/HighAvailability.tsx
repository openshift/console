import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { PageComponentProps } from '@console/internal/components/utils';
import { SectionHeading } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { MachineModel } from '@console/internal/models';
import type { MachineKind, NodeKind } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { getNodeMachineNameAndNamespace } from '@console/shared/src/selectors/node';
import {
  filterMachineHealthChecksForMachine,
  filterNodeHealthChecksForNode,
  useWatchMachineHealthChecks,
  useWatchNodeHealthChecks,
} from '../../utils/HealthCheckUtils';
import Details from './Details';
import HealthChecks from './HealthChecks';
import RemediationAgent from './RemediationAgent';

const HighAvailability: ComponentType<PageComponentProps<NodeKind>> = ({ obj: node }) => {
  const { t } = useTranslation();

  const [machineName, machineNamespace] = getNodeMachineNameAndNamespace(node);
  const hasMachineRef = Boolean(machineName && machineNamespace);

  const [machine, machineLoaded, machineLoadError] = useK8sWatchResource<MachineKind>(
    hasMachineRef
      ? {
          groupVersionKind: getGroupVersionKindForModel(MachineModel),
          name: machineName,
          namespace: machineNamespace,
        }
      : undefined,
  );
  const [
    machineHealthChecks,
    machineHealthChecksLoaded,
    machineHealthChecksLoadError,
  ] = useWatchMachineHealthChecks();
  const [
    nodeHealthChecks,
    nodeHealthChecksLoaded,
    nodeHealthChecksLoadError,
  ] = useWatchNodeHealthChecks();

  const matchingMachineHealthChecks = useMemo(() => {
    if (!machineHealthChecksLoaded || !hasMachineRef || machineLoadError || !machine) {
      return [];
    }
    return filterMachineHealthChecksForMachine(machineHealthChecks ?? [], machine);
  }, [machine, machineHealthChecks, machineHealthChecksLoaded, hasMachineRef, machineLoadError]);

  const matchingNodeHealthChecks = useMemo(() => {
    if (!nodeHealthChecksLoaded) {
      return [];
    }
    return filterNodeHealthChecksForNode(nodeHealthChecks ?? [], node);
  }, [node, nodeHealthChecks, nodeHealthChecksLoaded]);

  const loadError = machineHealthChecksLoadError || nodeHealthChecksLoadError;
  const isLoading =
    !machineHealthChecksLoaded ||
    !nodeHealthChecksLoaded ||
    (hasMachineRef && !machineLoaded && !machineLoadError);

  return (
    <PaneBody>
      <SectionHeading text={t('console-app~High availability')} />
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXl' }}>
        <FlexItem>
          <Details
            matchingMachineHealthChecks={matchingMachineHealthChecks}
            matchingNodeHealthChecks={matchingNodeHealthChecks}
            isLoading={isLoading}
            loadError={loadError}
          />
        </FlexItem>
        <FlexItem>
          <HealthChecks
            matchingMachineHealthChecks={matchingMachineHealthChecks}
            matchingNodeHealthChecks={matchingNodeHealthChecks}
            isLoading={isLoading}
            loadError={loadError}
          />
        </FlexItem>
        <FlexItem>
          <RemediationAgent
            matchingMachineHealthChecks={matchingMachineHealthChecks}
            matchingNodeHealthChecks={matchingNodeHealthChecks}
            isLoading={isLoading}
            loadError={loadError}
          />
        </FlexItem>
      </Flex>
    </PaneBody>
  );
};

export default HighAvailability;
