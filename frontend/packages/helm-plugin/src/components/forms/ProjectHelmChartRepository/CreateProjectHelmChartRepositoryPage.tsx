import * as React from 'react';
import Helmet from 'react-helmet';
import { match as RMatch } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
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
      <Helmet>
        <title>Create ProjectHelmChartRepository</title>
      </Helmet>
      <CreateProjectHelmChartRepository resource={newResource} namespace={namespace} />
    </NamespacedPage>
  );
};

export default CreateProjectHelmChartRepositoryPage;
