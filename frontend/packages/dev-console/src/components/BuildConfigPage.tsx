import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { BuildConfigsPage } from '@console/internal/components/build-config';
import { withStartGuide } from '../../../../public/components/start-guide';
import CreateProjectListPage from './projects/CreateProjectListPage';

export interface BuildConfigPageProps {
  match: RMatch<{
    ns?: string;
  }>;
  noProjectsAvailable?: boolean;
}

const BuildConfigPage: React.FC<BuildConfigPageProps> = ({ noProjectsAvailable, ...props }) => {
  const { t } = useTranslation();
  const namespace = props.match.params.ns;
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Builds')}</title>
      </Helmet>
      {namespace ? (
        <div>
          <BuildConfigsPage {...props} mock={noProjectsAvailable} />
        </div>
      ) : (
        <CreateProjectListPage title={t('devconsole~Build Configs')}>
          {t('devconsole~Select a project to view the list of build configs')}
        </CreateProjectListPage>
      )}
    </>
  );
};

export default withStartGuide(BuildConfigPage);
