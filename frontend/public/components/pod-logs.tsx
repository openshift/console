import type { FC } from 'react';
import { Component } from 'react';
import * as _ from 'lodash';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { useQueryParamsMutator } from '@console/shared/src/hooks/useQueryParamsMutator';
import type { ContainerSpec, ContainerStatus, PodKind } from '../module/k8s';
import { ContainerSelect } from './utils/container-select';
import {
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
  LOG_SOURCE_WAITING,
  ResourceLog,
} from './utils/resource-log';

type OrderedContainerStatuses = { [name: string]: ContainerStatus & { order: number } };

const containersToStatuses = (
  pod: PodKind,
  containers: ContainerSpec[],
): OrderedContainerStatuses =>
  _.reduce(
    containers,
    (accumulator: OrderedContainerStatuses, { name }, order) => {
      const containerStatus =
        _.find(pod.status?.containerStatuses, { name }) ||
        _.find(pod.status?.initContainerStatuses, { name });
      if (containerStatus) {
        return {
          ...accumulator,
          [name]: { ...containerStatus, order },
        };
      }
      return accumulator;
    },
    {},
  );

const containerToLogSourceStatus = (container?: ContainerStatus): string => {
  if (!container) {
    return LOG_SOURCE_WAITING;
  }

  const { state, lastState } = container;

  if (state?.waiting && !_.isEmpty(lastState)) {
    return LOG_SOURCE_RESTARTING;
  }

  if (state?.waiting) {
    return LOG_SOURCE_WAITING;
  }

  if (state?.terminated) {
    return LOG_SOURCE_TERMINATED;
  }

  return LOG_SOURCE_RUNNING;
};

interface PodLogsInnerProps {
  obj: PodKind;
  getQueryArgument: (arg: string) => string;
  setQueryArgument: (arg: string, value: string) => void;
}

interface PodLogsInnerState {
  containers: OrderedContainerStatuses;
  currentKey: string;
  initContainers: OrderedContainerStatuses;
}

class PodLogsInner extends Component<PodLogsInnerProps, PodLogsInnerState> {
  static getDerivedStateFromProps(
    { obj: pod }: PodLogsInnerProps,
    { currentKey }: PodLogsInnerState,
  ): Partial<PodLogsInnerState> {
    const newState: Partial<PodLogsInnerState> = {};
    const containers = _.get(pod, 'spec.containers', []) as ContainerSpec[];
    const initContainers = _.get(pod, 'spec.initContainers', []) as ContainerSpec[];
    newState.containers = containersToStatuses(pod, containers);
    newState.initContainers = containersToStatuses(pod, initContainers);
    if (!currentKey) {
      const firstContainer = _.find(newState.containers, { order: 0 });
      newState.currentKey = firstContainer ? firstContainer.name : '';
    }
    return newState;
  }

  constructor(props: PodLogsInnerProps) {
    super(props);
    this._selectContainer = this._selectContainer.bind(this);
    this.state = {
      containers: {},
      currentKey:
        props.getQueryArgument('container') ||
        props.obj.metadata?.annotations?.['kubectl.kubernetes.io/default-container'] ||
        '',
      initContainers: {},
    };
  }

  render() {
    const { containers, currentKey, initContainers } = this.state;
    const currentContainer = _.get(containers, currentKey) || _.get(initContainers, currentKey);
    const currentContainerStatus = containerToLogSourceStatus(currentContainer);
    const containerDropdown = (
      <ContainerSelect
        currentKey={currentKey}
        containers={containers}
        initContainers={initContainers}
        onChange={this._selectContainer}
      />
    );

    return (
      <PaneBody fullHeight>
        <ResourceLog
          containerName={currentContainer ? currentContainer.name : ''}
          dropdown={containerDropdown}
          resource={this.props.obj}
          resourceStatus={currentContainerStatus}
        />
      </PaneBody>
    );
  }

  _selectContainer(name: string) {
    this.setState({ currentKey: name }, () => {
      this.props.setQueryArgument('container', this.state.currentKey);
    });
  }
}

// Functional wrapper to inject router hooks as props
export const PodLogs: FC<PodLogsProps> = (props) => {
  const { getQueryArgument, setQueryArgument } = useQueryParamsMutator();
  return (
    <PodLogsInner
      {...props}
      getQueryArgument={getQueryArgument}
      setQueryArgument={setQueryArgument}
    />
  );
};

interface PodLogsProps {
  obj: PodKind;
}
