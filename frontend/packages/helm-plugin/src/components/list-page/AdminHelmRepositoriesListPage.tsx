import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { PageHeading } from '@console/internal/components/utils';
import RepositoriesPage from './RepositoriesListPage';

type PageContentsProps = {
  namespace: string;
};

const PageContents: React.FC<PageContentsProps> = ({ namespace }) => {
  const { t } = useTranslation();
  return namespace ? (
    <>
      <PageHeading title={t('helm-plugin~Helm Repositories')} className="co-m-nav-title--row">
        <div>
          <Link
            className="co-m-primary-action"
            to={`/ns/${namespace}/helmchartrepositories/~new/form`}
          >
            <Button variant="primary" id="yaml-create" data-test="item-create">
              {t('helm-plugin~Create Helm Repository')}
            </Button>
          </Link>
        </div>
      </PageHeading>
      <RepositoriesPage />
    </>
  ) : (
    <CreateProjectListPage title={t('helm-plugin~Helm Repositories')}>
      {(openProjectModal) => (
        <Trans t={t} ns="helm-plugin">
          Select a Project to view its details
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const AdminHelmRepositoriesListPage: React.FC = () => {
  const { ns } = useParams();
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <PageContents namespace={ns} />
    </NamespacedPage>
  );
};

export default AdminHelmRepositoriesListPage;
