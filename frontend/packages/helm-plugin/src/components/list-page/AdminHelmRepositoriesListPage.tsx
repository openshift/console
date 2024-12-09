import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { PageHeading } from '@console/internal/components/utils';
import RepositoriesPage from './RepositoriesListPage';

type PageContentsProps = {
  namespace: string;
};

const PageContents: React.FC<PageContentsProps> = ({ namespace }) => {
  const { t } = useTranslation();
  return (
    <>
      <PageHeading title={t('helm-plugin~Helm Repositories')} className="co-m-nav-title--row">
        <div>
          <Link
            className="co-m-primary-action"
            to={`/helmchartrepositories/ns/${namespace || 'default'}/~new/form`}
          >
            <Button variant="primary" id="yaml-create" data-test="item-create">
              {t('helm-plugin~Create Helm Repository')}
            </Button>
          </Link>
        </div>
      </PageHeading>
      <RepositoriesPage />
    </>
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
