import * as React from 'react';
import { match as RMatch } from 'react-router';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { history, StatusBox, LoadingBox } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import { AlertsDetailsPage } from '@console/internal/components/monitoring/alerting';
import { PrometheusRulesResponse } from '@console/internal/components/monitoring/types';
import { useURLPoll } from '@console/internal/components/utils/url-poll-hook';
import { PROMETHEUS_TENANCY_BASE_PATH } from '@console/internal/components/graphs';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { alertingRuleStateOrder } from '@console/internal/reducers/monitoring';
import { monitoringSetRules, monitoringLoaded } from '@console/internal/actions/ui';

interface MonitoringAlertsDetailsPageProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
}

const POLL_DELAY = 15 * 1000;

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push('/dev-monitoring/all-namespaces');
  } else {
    history.push('/dev-monitoring/ns/:ns/alerts');
  }
};

const MonitoringAlertsDetailsPage: React.FC<MonitoringAlertsDetailsPageProps> = ({ match }) => {
  const namespace = match.params.ns;
  const dispatch = useDispatch();
  const [response, loadError, loading] = useURLPoll<PrometheusRulesResponse>(
    `${PROMETHEUS_TENANCY_BASE_PATH}/api/v1/rules?namespace=${namespace}`,
    POLL_DELAY,
    namespace,
  );
  const thanosAlertsAndRules = React.useMemo(
    () => (!loading && !loadError ? getAlertsAndRules(response?.data) : { rules: [], alerts: [] }),
    [response, loadError, loading],
  );

  React.useEffect(() => {
    const sortThanosRules = _.sortBy(thanosAlertsAndRules.rules, (rule) =>
      alertingRuleStateOrder(rule),
    );
    dispatch(monitoringSetRules('devRules', sortThanosRules));
    dispatch(monitoringLoaded('devAlerts', thanosAlertsAndRules.alerts));
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
      <AlertsDetailsPage match={match} />
    </NamespacedPage>
  );
};

export default MonitoringAlertsDetailsPage;
