import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { withStartGuide } from '../../../../../public/components/start-guide';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';
import AddPageLayout from './AddPageLayout';

export interface AddPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

// Exported for testing
export const PageContents: React.FC<AddPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;

  return namespace ? (
    <AddPageLayout title={t('devconsole~Add')} />
  ) : (
    <CreateProjectListPage title={t('devconsole~Add')}>
      {(openProjectModal) => (
        <Trans t={t} ns="devconsole">
          Select a Project to start adding to it
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const AddPage: React.FC<AddPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const nsVariant = namespace ? null : NamespacedPageVariants.light;

  return (
    <>
      <Helmet>
        <title data-test-id="page-title">{`+${t('devconsole~Add')}`}</title>
      </Helmet>
      <NamespacedPage variant={nsVariant} hideApplications>
        <PageContentsWithStartGuide match={match} />
      </NamespacedPage>
    </>
  );
};

export default AddPage;
