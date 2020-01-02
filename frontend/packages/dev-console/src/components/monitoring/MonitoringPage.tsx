import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Firehose, HorizontalNav, PageHeading, history } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/internal/const';
import { ProjectModel } from '@console/internal/models';
import { TechPreviewBadge } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import ProjectListPage from '../projects/ProjectListPage';
import MonitoringDashboard from './MonitoringDashboard';
import MonitoringMetrics from './MonitoringMetrics';
import { connectActiveNamespace, ConnectActiveNamespaceProps, redirectURI } from './utils';

const handleNamespaceChange = (newNamespace: string): void => {
  history.push(redirectURI(newNamespace));
};

export const MonitoringPage: React.FC<ConnectActiveNamespaceProps> = ({
  activeNamespace,
  ...props
}) => {
  const allNamespaces = activeNamespace === ALL_NAMESPACES_KEY;

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
        {allNamespaces ? (
          <ProjectListPage badge={<TechPreviewBadge />} title="Monitoring">
            Select a project to view monitoring metrics
          </ProjectListPage>
        ) : (
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
        )}
      </NamespacedPage>
    </>
  );
};

export default connectActiveNamespace(MonitoringPage);
