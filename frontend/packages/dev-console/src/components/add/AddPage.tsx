import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { withStartGuide } from '@console/internal/components/start-guide';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';
import AddPageLayout from './AddPageLayout';

// Exported for testing
export const PageContents: FC = () => {
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

const AddPage: FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const nsVariant = namespace ? null : NamespacedPageVariants.light;

  return (
    <>
      <DocumentTitle>{`+${t('devconsole~Add')}`}</DocumentTitle>
      <NamespacedPage variant={nsVariant} hideApplications>
        <PageContentsWithStartGuide />
      </NamespacedPage>
    </>
  );
};

export default AddPage;
