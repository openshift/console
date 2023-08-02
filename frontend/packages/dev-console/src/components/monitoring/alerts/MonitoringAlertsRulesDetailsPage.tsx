import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
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

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push('/dev-monitoring/all-namespaces');
  } else {
    history.push('/dev-monitoring/ns/:ns/alerts');
  }
};

const MonitoringAlertsDetailsPage: React.FC = () => {
  const { ns: namespace } = useParams();
  const location = useLocation();
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
      {location.pathname.includes('alerts') && <AlertsDetailsPage />}
      {location.pathname.includes('rules') && <AlertRulesDetailsPage />}
    </NamespacedPage>
  );
};

export default MonitoringAlertsDetailsPage;
