import * as React from 'react';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { Firehose, HorizontalNav, PageHeading, history } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/internal/const';
import { ProjectModel } from '@console/internal/models';
import { TechPreviewBadge } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import ProjectListPage from '../projects/ProjectListPage';
import MonitoringDashboard from './dashboard/MonitoringDashboard';
import MonitoringMetrics from './metrics/MonitoringMetrics';

export const MONITORING_NS_PAGE_URI = '/dev-monitoring/ns';
export const MONITORING_ALL_NS_PAGE_URI = '/dev-monitoring/all-namespaces';

export interface MonitoringPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const handleNamespaceChange = (newNamespace: string): void => {
  const redirectURI =
    newNamespace === ALL_NAMESPACES_KEY
      ? `${MONITORING_ALL_NS_PAGE_URI}`
      : `${MONITORING_NS_PAGE_URI}/${newNamespace}`;

  history.push(redirectURI);
};

export const MonitoringPage: React.FC<MonitoringPageProps> = (props) => {
  const activeNamespace = _.get(props, 'match.params.ns');

  return (
    <>
      <Helmet>
        <title>Monitoring</title>
      </Helmet>
      <NamespacedPage
        hideApplications
        variant={NamespacedPageVariants.light}
        onNamespaceChange={handleNamespaceChange}
      >
        {activeNamespace ? (
          <Firehose
            resources={[
              {
                kind: ProjectModel.kind,
                kindObj: ProjectModel,
                name: activeNamespace,
                namespace: activeNamespace,
                isList: false,
                prop: 'obj',
              },
            ]}
          >
            <PageHeading badge={<TechPreviewBadge />} title="Monitoring" />
            <HorizontalNav
              pages={[
                {
                  href: '',
                  name: 'Dashboard',
                  component: MonitoringDashboard,
                },
                {
                  href: 'metrics',
                  name: 'Metrics',
                  component: MonitoringMetrics,
                },
              ]}
              className={`co-m-${ProjectModel.kind}`}
              match={props.match}
              noStatusBox
            />
          </Firehose>
        ) : (
          <ProjectListPage badge={<TechPreviewBadge />} title="Monitoring">
            Select a project to view monitoring metrics
          </ProjectListPage>
        )}
      </NamespacedPage>
    </>
  );
};

export default MonitoringPage;
