import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EmptyBox } from '@console/internal/components/utils';
import { ContainerDropdown, getQueryArgument, ResourceLog, setQueryArgument } from '../utils';
import { Alert, Rule } from './types';
import { K8sResourceKind } from '../../module/k8s';
import { containerToLogSourceStatus, containersToStatuses } from './alert-logs-utils';
import { RootState } from '../../redux';
import { getURLSearchParams } from '../utils/link';
import { alertsToProps } from './utils';

type AlertLogsProps = {
  alert: Alert;
  obj: K8sResourceKind;
  params?: any;
  rule: Rule;
  match?: any;
  customData?: any;
  filters?: any;
  loadError?: string;
  loaded: boolean;
};

type AlertDetailProps = {
  alert: Alert;
  loaded: boolean;
  loadError?: string;
  rule: Rule;
};

const AlertLogs: React.FC<AlertLogsProps> = (props) => {
  const { t } = useTranslation();
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
        const firstContainer: any = _.find(containersToStatuses(build, currentContainers), {
          order: 0,
        } as any);
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
    <div className="co-m-pane__body">
      {props.alert?.labels?.namespace ? (
        <ResourceLog
          containerName={currentContainer ? currentContainer.name : ''}
          dropdown={containerDropdown}
          resource={props.obj}
          resourceStatus={currentContainerStatus}
        />
      ) : (
        <EmptyBox label={t('public~alert logs')} />
      )}
    </div>
  );
};

const alertStateToProps = (state: RootState, props): AlertDetailProps => {
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

export default connect(alertStateToProps)(AlertLogs);
