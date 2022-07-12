import * as React from 'react';
import Helmet from 'react-helmet';
import { match as RMatch } from 'react-router-dom';
import { NamespacedPageVariants } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import NamespacedPage from '@console/shared/src/components/projects/NamespacedPage';
import { ProjectHelmChartRepositoryType } from '../../../types/helm-types';
import CreateProjectHelmChartRepository from './CreateProjectHelmChartRepository';
import { getDefaultResource } from './projecthelmchartrepository-create-utils';

type CreateProjectHelmChartRepositoryPageProps = {
  match: RMatch<{
    ns?: string;
  }>;
};

const CreateProjectHelmChartRepositoryPage: React.FC<CreateProjectHelmChartRepositoryPageProps> = ({
  match,
}) => {
  const namespace = match.params.ns;

  const newResource: ProjectHelmChartRepositoryType = getDefaultResource(namespace);

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications disabled>
      <Helmet data-test="helm-plugin~title Create ProjectHelmChartRepository">
        <title>Create ProjectHelmChartRepository</title>
      </Helmet>
      <CreateProjectHelmChartRepository resource={newResource} namespace={namespace} />
    </NamespacedPage>
  );
};

export default CreateProjectHelmChartRepositoryPage;
