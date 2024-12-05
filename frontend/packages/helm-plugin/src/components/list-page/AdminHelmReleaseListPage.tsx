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
import HelmReleaseList from './HelmReleaseList';

type PageContentsProps = {
  namespace: string;
};

const PageContents: React.FC<PageContentsProps> = ({ namespace }) => {
  const { t } = useTranslation();
  return namespace ? (
    <>
      <PageHeading title={t('helm-plugin~Helm Releases')} className="co-m-nav-title--row">
        <div>
          <Link
            className="co-m-primary-action"
            to={`/catalog/ns/${namespace}?catalogType=HelmChart`}
          >
            <Button variant="primary" id="yaml-create" data-test="item-create">
              {t('helm-plugin~Create Helm Release')}
            </Button>
          </Link>
        </div>
      </PageHeading>
      <HelmReleaseList />
    </>
  ) : (
    <CreateProjectListPage title={t('helm-plugin~Helm Releases')}>
      {(openProjectModal) => (
        <Trans t={t} ns="helm-plugin">
          Select a Project to view its details
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const AdminHelmReleaseListPage: React.FC = () => {
  const { ns } = useParams();
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <PageContents namespace={ns} />
    </NamespacedPage>
  );
};

export default AdminHelmReleaseListPage;
