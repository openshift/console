import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import RepositoriesPage from './RepositoriesListPage';

const AdminHelmRepositoriesListPage: React.FC = () => {
  const { ns } = useParams();
  const { t } = useTranslation();

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <RepositoriesPage
        title={t('helm-plugin~Helm Repositories')}
        createButtonText={t('helm-plugin~Create Helm Repository')}
        createProps={{ to: `/helm-repositories/ns/${ns || 'default'}/~new/form` }}
        canCreate
      />
    </NamespacedPage>
  );
};

export default AdminHelmRepositoriesListPage;
