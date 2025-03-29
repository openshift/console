import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { FLAGS, useFlag } from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { withStartGuide } from '../../../../../public/components/start-guide';
import CatalogPageHelpText from '../catalog/CatalogPageHelpText';
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
            <CatalogPageHelpText>
              <Trans t={t} ns="devconsole">
                Select a Project to start adding to it
                <CreateAProjectButton openProjectModal={openProjectModal} />.
              </Trans>
            </CatalogPageHelpText>
          ) : (
            <CatalogPageHelpText>
              <Trans t={t} ns="devconsole">
                Select a Namespace to start adding to it
                <CreateAProjectButton openProjectModal={openProjectModal} />.
              </Trans>
            </CatalogPageHelpText>
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
      <DocumentTitle>{`+${t('devconsole~Add')}`}</DocumentTitle>
      <NamespacedPage variant={nsVariant} hideApplications>
        <PageContentsWithStartGuide />
      </NamespacedPage>
    </>
  );
};

export default AddPage;
