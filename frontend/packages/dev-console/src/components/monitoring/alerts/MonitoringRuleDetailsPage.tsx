import * as React from 'react';
import { AlertRulesDetailsPage } from '@console/internal/components/monitoring/alerting';
import { history } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import { match as RMatch } from 'react-router-dom';

type MonitoringRuleDetailsPageProps = {
  match: RMatch<{
    ns?: string;
  }>;
};

const handleNamespaceChange = (ns: string): void => {
  ns === ALL_NAMESPACES_KEY
    ? history.push('/dev-monitoring/all-namespaces')
    : history.push('/dev-monitoring/ns/:ns/alerts');
};

const MonitoringRuleDetailsPage: React.FC<MonitoringRuleDetailsPageProps> = ({ match }) => {
  return (
    <NamespacedPage
      variant={NamespacedPageVariants.light}
      hideApplications
      onNamespaceChange={handleNamespaceChange}
    >
      <AlertRulesDetailsPage match={match} />
    </NamespacedPage>
  );
};

export default MonitoringRuleDetailsPage;
