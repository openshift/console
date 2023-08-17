import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';
import { match as RMatch } from 'react-router';
import {
  useResolvedExtensions,
  AlertingRulesSourceExtension,
  isAlertingRulesSource,
} from '@console/dynamic-plugin-sdk';
import {
  AlertsDetailsPage,
  AlertRulesDetailsPage,
} from '@console/internal/components/monitoring/alerting';
import { history, StatusBox, LoadingBox } from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import { useAlertManagerSilencesDispatch } from './monitoring-alerts-utils';
import { useRulesAlertsPoller } from './useRuleAlertsPoller';

interface MonitoringAlertsDetailsPageProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
}

const ALERT_DETAILS_PATH = '/dev-monitoring/ns/:ns/alerts/:ruleID';
const RULE_DETAILS_PATH = '/dev-monitoring/ns/:ns/rules/:id';

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push('/dev-monitoring/all-namespaces');
  } else {
    history.push('/dev-monitoring/ns/:ns/alerts');
  }
};

const MonitoringAlertsDetailsPage: React.FC<MonitoringAlertsDetailsPageProps> = ({ match }) => {
  const namespace = match.params.ns;
  const { path } = match;
  const dispatch = useDispatch();
  const alerts = useSelector(({ observe }: RootState) => observe.get('devAlerts'));
  const [customExtensions] = useResolvedExtensions<AlertingRulesSourceExtension>(
    isAlertingRulesSource,
  );
  const alertsSource = React.useMemo(
    () =>
      customExtensions
        // 'dev-observe-alerting' is the id that plugin extensions can use to contribute alerting rules to this component
        .filter((extension) => extension.properties.contextId === 'dev-observe-alerting')
        .map((extension) => extension.properties),
    [customExtensions],
  );

  useAlertManagerSilencesDispatch({ namespace });
  useRulesAlertsPoller(namespace, dispatch, alertsSource);

  if (!alerts?.loaded && _.isEmpty(alerts?.loadError)) {
    return <LoadingBox />;
  }

  if (!_.isEmpty(alerts?.loadError)) {
    return <StatusBox loaded={alerts?.loaded} loadError={alerts?.loadError} />;
  }

  return (
    <NamespacedPage
      variant={NamespacedPageVariants.light}
      hideApplications
      onNamespaceChange={handleNamespaceChange}
    >
      {path === ALERT_DETAILS_PATH && <AlertsDetailsPage match={match} />}
      {path === RULE_DETAILS_PATH && <AlertRulesDetailsPage match={match} />}
    </NamespacedPage>
  );
};

export default MonitoringAlertsDetailsPage;
