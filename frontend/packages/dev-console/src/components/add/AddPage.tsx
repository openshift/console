import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { FLAGS, useFlag } from '@console/shared';
import { withStartGuide } from '../../../../../public/components/start-guide';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';
import AddPageLayout from './AddPageLayout';

// Exported for testing
export const PageContents: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const isOpenShift = useFlag(FLAGS.OPENSHIFT);

  if (!namespace) {
    return (
      <CreateProjectListPage title={t('devconsole~Add')}>
        {(openProjectModal) =>
          isOpenShift ? (
            <Trans t={t} ns="devconsole">
              Select a Project to start adding to it
              <CreateAProjectButton openProjectModal={openProjectModal} />.
            </Trans>
          ) : (
            <Trans t={t} ns="devconsole">
              Select a Namespace to start adding to it
              <CreateAProjectButton openProjectModal={openProjectModal} />.
            </Trans>
          )
        }
      </CreateProjectListPage>
    );
  }

  return <AddPageLayout title={t('devconsole~Add')} />;
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const AddPage: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const nsVariant = namespace ? null : NamespacedPageVariants.light;

  return (
    <>
      <Helmet>
        <title data-test-id="page-title">{`+${t('devconsole~Add')}`}</title>
      </Helmet>
      <NamespacedPage variant={nsVariant} hideApplications>
        <PageContentsWithStartGuide />
      </NamespacedPage>
    </>
  );
};

export default AddPage;
