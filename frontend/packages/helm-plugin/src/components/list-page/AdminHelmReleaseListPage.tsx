import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { withStartGuide } from '@console/internal/components/start-guide';
import { EmptyBox, PageHeading } from '@console/internal/components/utils';
import { FLAGS, useFlag } from '@console/shared';
import HelmReleaseList from './HelmReleaseList';

type PageContentsProps = {
  namespace: string;
};

const PageContents: React.FC<PageContentsProps> = ({ namespace }) => {
  const { t } = useTranslation();
  const canListNS = useFlag(FLAGS.CAN_LIST_NS);
  return namespace || canListNS ? (
    <>
      <PageHeading title={t('helm-plugin~Helm Releases')} navTitleAsRow>
        <div>
          <Link to={`/catalog/ns/${namespace || 'default'}?catalogType=HelmChart`}>
            <Button variant="primary" id="yaml-create" data-test="item-create">
              {t('helm-plugin~Create Helm Release')}
            </Button>
          </Link>
        </div>
      </PageHeading>
      <HelmReleaseList />
    </>
  ) : (
    <>
      <PageHeading title={t('helm-plugin~Helm Releases')} />
      <EmptyBox label={t('helm-plugin~Helm Releases')} />
    </>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const AdminHelmReleaseListPage: React.FC = () => {
  const { ns } = useParams();
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <PageContentsWithStartGuide namespace={ns} />
    </NamespacedPage>
  );
};

export default AdminHelmReleaseListPage;
