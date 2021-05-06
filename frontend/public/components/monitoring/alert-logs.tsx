import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';

import { ContainerDropdown, getQueryArgument, ResourceLog, setQueryArgument } from '../utils';

import { Alert, Rule } from './types';

import {
  K8sResourceCommon,
  Selector,
  MatchLabels,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';

import {
  alertStateToProps,
  containerToLogSourceStatus,
  containersToStatuses,
} from './alert-logs-utils';

const AlertLogs = (props: AlertLogsProps) => {
  const [containers, setContainers] = React.useState({});
  const [currentKey, setCurrentKey] = React.useState(getQueryArgument('container') || '');
  const [initContainers, setInitContainers] = React.useState({});

  const buildObj = React.useRef(props.obj);

  React.useEffect(
    () => {
      const build = props.obj;
      const currentContainers = build?.spec?.containers ?? [];
      const currentInitContainers = build?.spec?.initContainers ?? [];
      if (!currentKey) {
        const firstContainer = _.find(containersToStatuses(build, currentContainers), { order: 0 });
        setCurrentKey(firstContainer ? firstContainer.name : '');
      }
      setContainers(containersToStatuses(build, currentContainers));
      setInitContainers(containersToStatuses(build, currentInitContainers));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buildObj.current],
  );

  const selectContainer = (name) => {
    setCurrentKey(name);
    setQueryArgument('container', currentKey);
  };

  const currentContainer = containers?.[currentKey] ?? initContainers?.[currentKey];
  const currentContainerStatus = containerToLogSourceStatus(currentContainer);

  const containerDropdown = (
    <ContainerDropdown
      currentKey={currentKey}
      containers={containers}
      initContainers={initContainers}
      onChange={selectContainer}
    />
  );

  return (
    <>
      <div className="co-m-pane__body">
        {props.alert?.labels?.namespace ? (
          <ResourceLog
            containerName={currentContainer ? currentContainer.name : ''}
            dropdown={containerDropdown}
            resource={props.obj}
            resourceStatus={currentContainerStatus}
          />
        ) : (
          <div>No logs for this Alert</div>
        )}
      </div>
    </>
  );
};

export default connect(alertStateToProps)(AlertLogs);

export type AlertLogsProps = {
  alert: Alert;
  obj: ResourceKindAlert;
  params?: any;
  rule: Rule;
  match?: any;
  customData?: any;
  filters?: any;
  loadError?: string;
  loaded: boolean;
};

export type ResourceKindAlert = K8sResourceCommon & {
  spec?: {
    selector?: Selector | MatchLabels;
    [key: string]: any;
  };
  status: { [key: string]: any };
  data?: { [key: string]: any };
};
