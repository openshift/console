import * as React from 'react';
import { match as RMatch } from 'react-router';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { history, StatusBox, LoadingBox } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import {
  AlertsDetailsPage,
  AlertRulesDetailsPage,
} from '@console/internal/components/monitoring/alerting';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { alertingRuleStateOrder } from '@console/internal/reducers/monitoring';
import { monitoringSetRules, monitoringLoaded } from '@console/internal/actions/ui';
import { usePrometheusRulesPoll } from '@console/internal/components/graphs/prometheus-rules-hook';

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
  const [response, loadError, loading] = usePrometheusRulesPoll({ namespace });
  const thanosAlertsAndRules = React.useMemo(
    () => (!loading && !loadError ? getAlertsAndRules(response?.data) : { rules: [], alerts: [] }),
    [response, loadError, loading],
  );

  React.useEffect(() => {
    const sortThanosRules = _.sortBy(thanosAlertsAndRules.rules, alertingRuleStateOrder);
    dispatch(monitoringSetRules('devRules', sortThanosRules, 'dev'));
    dispatch(monitoringLoaded('devAlerts', thanosAlertsAndRules.alerts, 'dev'));
  }, [dispatch, thanosAlertsAndRules]);

  if (loading && _.isEmpty(loadError)) {
    return <LoadingBox />;
  }

  if (!_.isEmpty(loadError)) {
    return <StatusBox loaded={!loading} loadError={loadError} />;
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
