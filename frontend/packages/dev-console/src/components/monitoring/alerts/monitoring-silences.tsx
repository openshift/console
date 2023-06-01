import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch } from 'react-redux';
import { alertingLoaded } from '@console/internal/actions/observe';
import { usePrometheusRulesPoll } from '@console/internal/components/graphs/prometheus-rules-hook';
import {
  SilencesDetailsPage,
  SilencesPage,
} from '@console/internal/components/monitoring/alerting';
import { CreateSilence, EditSilence } from '@console/internal/components/monitoring/silence-form';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { history } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY, useActiveNamespace } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import { useAlertManagerSilencesDispatch } from './monitoring-alerts-utils';

export const MonitoringCreateSilencePage: React.FC<{}> = () => (
  <NamespacedPage
    hideApplications
    onNamespaceChange={(ns: string) => {
      history.replace(
        ns === ALL_NAMESPACES_KEY
          ? '/dev-monitoring/all-namespaces'
          : `/dev-monitoring/ns/${ns}/silences/~new`,
      );
    }}
    variant={NamespacedPageVariants.light}
  >
    <CreateSilence />
  </NamespacedPage>
);

const ConnectedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [namespace] = useActiveNamespace();

  const dispatch = useDispatch();

  useAlertManagerSilencesDispatch({ namespace });

  const [response, loadError, loading] = usePrometheusRulesPoll({ namespace });

  React.useEffect(() => {
    if (!loading && !loadError) {
      dispatch(alertingLoaded('devAlerts', getAlertsAndRules(response?.data)?.alerts, 'dev'));
    }
  }, [dispatch, response, loadError, loading]);

  return <>{children}</>;
};

export const MonitoringEditSilencePage: React.FC<{ match: any }> = ({ match }) => (
  <ConnectedPage>
    <NamespacedPage
      hideApplications
      onNamespaceChange={(ns: string) => {
        history.replace(
          ns === ALL_NAMESPACES_KEY
            ? '/dev-monitoring/all-namespaces'
            : `/dev-monitoring/ns/${ns}/silences`,
        );
      }}
      variant={NamespacedPageVariants.light}
    >
      <EditSilence match={match} />
    </NamespacedPage>
  </ConnectedPage>
);

export const MonitoringSilencesPage: React.FC<{}> = () => (
  <ConnectedPage>
    <SilencesPage />
  </ConnectedPage>
);

export const MonitoringSilenceDetailsPage: React.FC<{ match: any }> = ({ match }) => (
  <ConnectedPage>
    <NamespacedPage
      hideApplications
      onNamespaceChange={(ns: string) => {
        history.push(
          ns === ALL_NAMESPACES_KEY
            ? '/dev-monitoring/all-namespaces'
            : `/dev-monitoring/ns/${ns}/silences`,
        );
      }}
      variant={NamespacedPageVariants.light}
    >
      <SilencesDetailsPage match={match} />
    </NamespacedPage>
  </ConnectedPage>
);
