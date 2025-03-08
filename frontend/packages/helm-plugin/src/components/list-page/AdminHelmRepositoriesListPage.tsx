import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { withStartGuide } from '@console/internal/components/start-guide';
import { FLAGS, useFlag } from '@console/shared';
import RepositoriesPage from './RepositoriesListPage';

const PageContents: React.FC = () => {
  const { ns } = useParams();
  const canListNS = useFlag(FLAGS.CAN_LIST_NS);
  const { t } = useTranslation();

  return ns || canListNS ? (
    <RepositoriesPage
      title={t('helm-plugin~Helm Repositories')}
      createButtonText={t('helm-plugin~Create Helm Repository')}
      createProps={{ to: `/helm-repositories/ns/${ns || 'default'}/~new/form` }}
      canCreate
    />
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

const PageContentsWithStartGuide = withStartGuide(PageContents);

const AdminHelmRepositoriesListPage: React.FC = () => (
  <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
    <PageContentsWithStartGuide />
  </NamespacedPage>
);

export default AdminHelmRepositoriesListPage;
