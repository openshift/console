import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { TechPreviewBadge } from '@console/shared';
import { QueryBrowserPage } from '@console/internal/components/monitoring/metrics';
import { withStartGuide } from '@console/internal/components/start-guide';
import ProjectListPage from './projects/ProjectListPage';
import NamespacedPage, { NamespacedPageVariants } from './NamespacedPage';

export interface MetricsPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const MetricsPage: React.FC<MetricsPageProps> = ({ match }) => {
  const namespace = match.params.ns;
  return (
    <NamespacedPage variant={NamespacedPageVariants.light}>
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
    </NamespacedPage>
  );
};

export default withStartGuide(MetricsPage);
