import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { withStartGuide } from '@console/internal/components/start-guide';
import { EmptyBox } from '@console/internal/components/utils';
import { FLAGS, useFlag } from '@console/shared';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
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
    <>
      <PageHeading title={t('helm-plugin~Helm Repositories')} />
      <EmptyBox label={t('helm-plugin~Helm Repositories')} />
    </>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const AdminHelmRepositoriesListPage: React.FC = () => (
  <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
    <PageContentsWithStartGuide />
  </NamespacedPage>
);

export default AdminHelmRepositoriesListPage;
