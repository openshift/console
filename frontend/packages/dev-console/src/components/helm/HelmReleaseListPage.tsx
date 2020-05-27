import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import Helmet from 'react-helmet';
import { PageHeading } from '@console/internal/components/utils';
import ProjectListPage from '../projects/ProjectListPage';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import HelmReleaseList from './list/HelmReleaseList';

type HelmReleaseListPageProps = RouteComponentProps<{ ns: string }>;

export const HelmReleaseListPage: React.FC<HelmReleaseListPageProps> = (props) => {
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <Helmet>
        <title>Helm Releases</title>
      </Helmet>
      {namespace ? (
        <div>
          <PageHeading title="Helm Releases" />
          <HelmReleaseList namespace={namespace} />
        </div>
      ) : (
        <ProjectListPage title="Helm Releases">
          Select a project to view the list of Helm Releases
        </ProjectListPage>
      )}
    </NamespacedPage>
  );
};

export default HelmReleaseListPage;
