import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';

import {
  ContainerDropdown,
  getQueryArgument,
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
  LOG_SOURCE_WAITING,
  ResourceLog,
  setQueryArgument,
} from '../utils';

import { getURLSearchParams } from '../utils/link';

import { alertsToProps } from '../monitoring/utils';

const containersToStatuses = ({ status }, containers) => {
  return _.reduce(
    containers,
    (accumulator, { name }, order) => {
      const containerStatus =
        _.find(status.containerStatuses, { name }) ||
        _.find(status.initContainerStatuses, { name });
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
};

const containerToLogSourceStatus = (container) => {
  if (!container) {
    return LOG_SOURCE_WAITING;
  }

  const { state, lastState } = container;

  if (state.waiting && !_.isEmpty(lastState)) {
    return LOG_SOURCE_RESTARTING;
  }

  if (state.waiting) {
    return LOG_SOURCE_WAITING;
  }

  if (state.terminated) {
    return LOG_SOURCE_TERMINATED;
  }

  return LOG_SOURCE_RUNNING;
};

const alertStateToProps = (state, props) => {
  const { match } = props;
  const perspective = _.has(match.params, 'ns') ? 'dev' : 'admin';
  const { data, loaded, loadError } = alertsToProps(state, perspective);
  const ruleID = match?.params?.ruleID;
  const labels = getURLSearchParams();
  const alerts = _.filter(data, (a) => a.rule.id === ruleID);
  const rule = alerts?.[0]?.rule;
  const alert = _.find(alerts, (a) => _.isEqual(a.labels, labels));
  return {
    alert,
    loaded,
    loadError,
    rule,
  };
};

const AlertLogs1 = (props) => {
  const [containers, setContainers] = React.useState({});
  const [currentKey, setCurrentKey] = React.useState(getQueryArgument('container') || '');
  const [initContainers, setInitContainers] = React.useState({});

  React.useEffect(() => {
    const build = props.obj;
    const currentContainers = _.get(build, 'spec.containers', []);
    const currentInitContainers = _.get(build, 'spec.initContainers', []);
    setContainers(containersToStatuses(build, currentContainers));
    setInitContainers(containersToStatuses(build, currentInitContainers));
    if (!currentKey) {
      const firstContainer = _.find(containers, { order: 0 });
      setCurrentKey(firstContainer ? firstContainer.name : '');
    }
  }, [containers, currentKey, props.obj]);

  function _selectContainer(name) {
    setCurrentKey(name);
    setQueryArgument('container', currentKey);
  }

  const currentContainer = _.get(containers, currentKey) || _.get(initContainers, currentKey);
  const currentContainerStatus = containerToLogSourceStatus(currentContainer);

  const containerDropdown = (
    <ContainerDropdown
      currentKey={currentKey}
      containers={containers}
      initContainers={initContainers}
      onChange={_selectContainer}
    />
  );

  return (
    <>
      {props.alert?.labels?.namespace && (
        <div className="co-m-pane__body">
          <ResourceLog
            containerName={currentContainer ? currentContainer.name : ''}
            dropdown={containerDropdown}
            resource={props.obj}
            resourceStatus={currentContainerStatus}
          />
        </div>
      )}
      {!props.alert?.labels?.namespace && (
        <div className="co-m-pane__body">No logs for this Alert</div>
      )}
    </>
  );
};

export default connect(alertStateToProps)(AlertLogs1);
