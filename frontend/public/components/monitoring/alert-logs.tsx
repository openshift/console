import * as _ from 'lodash-es';
import * as React from 'react';
import { coFetch } from '@console/internal/co-fetch';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../redux';
import { ContainerDropdown, getQueryArgument, setQueryArgument, LoadingBox } from '../utils';
import { getURLSearchParams } from '../utils/link';
import { alertsToProps } from './utils';
import { Alert, Rule } from './types';
import { Button, TimePicker, TextInput } from '@patternfly/react-core';
import { containerToLogSourceStatus, containersToStatuses } from './alert-logs-utils';
import { AlertResourceLog } from '../utils/alert-resource-log';
import { useK8sGet } from '../utils/k8s-get-hook';
import { InfrastructureModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { EmptyBox } from '@console/internal/components/utils';

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
  const [timeInput, setTimeInput] = React.useState('');
  const [maxLogsInput, setMaxLogsInput] = React.useState('');
  const [alertLogs, setAlertLogs]: any = React.useState('');

  const [infrastructure] = useK8sGet<K8sResourceKind>(InfrastructureModel, 'cluster');

  const buildObj = React.useRef(props.obj);

  const constructApiUrl = (infrastructureInfo) => {
    const apiServerURL = infrastructureInfo?.status?.apiServerURL;
    const logExplorationApiUrl = `http://log-exploration-api-route-openshift-logging.apps.${
      apiServerURL.split('.')[1]
    }.devcluster.openshift.com/logs/filter?`;
    return logExplorationApiUrl;
  };

  React.useEffect(() => {
    const asyncFn = async () => {
      const url = constructApiUrl(infrastructure);
      const { pod, namespace } = props.alert?.labels;
      try {
        const response = await coFetch(
          url +
            new URLSearchParams({
              namespace,
              pod,
            }),
        );
        const messageArray = [];
        await response.json().then((json) => {
          json.Logs.forEach((element) => {
            const logMessage = JSON.parse(element)._source.message;
            messageArray.push(logMessage);
          });
          setAlertLogs(messageArray);
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        throw err;
      }
    };
    if (infrastructure) {
      asyncFn();
    }
  }, [infrastructure, props.alert]);

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
    [buildObj?.current],
  );

  const selectContainer = (name) => {
    setCurrentKey(name);
    setQueryArgument('container', currentKey);
  };

  const handleTimeInputChange = (value) => {
    setTimeInput(value);
  };

  const handleTextInputChange = (value) => {
    setMaxLogsInput(value);
  };

  const convertToMilliSeconds = (hours, minutes) => {
    const timeInMinutes = hours * 60 + minutes;
    const timeInMilliSeconds = timeInMinutes * 60 * 1000;
    return timeInMilliSeconds;
  };

  const getStartTime = () => {
    const { activeAt } = props.alert;
    const splittedTime = timeInput.split('h', 2);
    const alertDate = new Date(activeAt);
    const alertTimeMilliSec = alertDate.getTime();
    const startTime =
      alertTimeMilliSec -
      convertToMilliSeconds(parseInt(splittedTime[0], 10), parseInt(splittedTime[1], 10));
    const startDate = new Date(startTime);
    return startDate.toISOString();
  };

  const handleSubmit = async () => {
    const { pod, namespace } = props.alert?.labels;
    const { activeAt } = props.alert;
    const startTimeIso = getStartTime();
    const url = constructApiUrl(infrastructure);

    try {
      const response = await coFetch(
        url +
          new URLSearchParams({
            namespace,
            pod,
            startTime: activeAt,
            endTime: startTimeIso,
            maxlogs: maxLogsInput,
          }),
      );
      const messageArray = [];
      await response.json().then((json) => {
        json.Logs.forEach((element) => {
          const logMessage = JSON.parse(element)._source.message;
          messageArray.push(logMessage);
        });
        setAlertLogs(messageArray);
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      throw err;
    }
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
        <>
          <div className="row">
            <div className="col-sm-3">
              <TimePicker
                is24Hour
                delimiter="h"
                placeholder="Time"
                onChange={handleTimeInputChange}
              />
            </div>
            <div className="col-sm-3">
              <TextInput
                isRequired
                type="text"
                id="simple-form-name"
                name="simple-form-name"
                aria-describedby="simple-form-name-helper"
                value={maxLogsInput}
                onChange={handleTextInputChange}
                placeholder="Max Logs"
              />
            </div>
            <div className="col-sm-3">
              <Button variant="primary" onClick={handleSubmit} isDisabled={timeInput === ''}>
                Get Logs
              </Button>
            </div>
          </div>
          {alertLogs !== '' ? (
            <div>
              <AlertResourceLog
                containerName={currentContainer ? currentContainer.name : ''}
                dropdown={containerDropdown}
                resource={props.obj}
                resourceStatus={currentContainerStatus}
                alertLogs={alertLogs}
              />
            </div>
          ) : (
            <LoadingBox />
          )}
        </>
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
