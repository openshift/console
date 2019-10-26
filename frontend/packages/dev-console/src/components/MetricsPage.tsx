import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { TechPreviewBadge } from '@console/shared';
import { QueryBrowserPage } from '@console/internal/components/monitoring/metrics';
import { NamespaceBar } from '@console/internal/components/namespace';
import { withStartGuide } from '@console/internal/components/start-guide';
import ProjectListPage from './projects/ProjectListPage';

export interface MetricsPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const MetricsPage: React.FC<MetricsPageProps> = ({ match }) => {
  const namespace = match.params.ns;
  return (
    <>
      <NamespaceBar />
      <Helmet>
        <title>Metrics</title>
      </Helmet>
      {namespace ? (
        <QueryBrowserPage namespace={namespace} />
      ) : (
        <ProjectListPage badge={<TechPreviewBadge />} title="Metrics">
          Select a project to view metrics
        </ProjectListPage>
      )}
    </>
  );
};

export default withStartGuide(MetricsPage);
