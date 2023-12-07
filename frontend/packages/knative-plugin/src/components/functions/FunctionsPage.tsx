import * as React from 'react';
import Helmet from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { ListPage } from '@console/internal/components/factory';
import { withStartGuide } from '@console/internal/components/start-guide';
import { PageHeading } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import { ServiceTypeValue } from '../../types';
import { CreateActionDropdown } from './CreateActionDropdown';
import FunctionsList from './FunctionsList';
import { GettingStartedSection } from './GettingStartedSection';
import { KnativeServiceTypeContext } from './ServiceTypeContext';

import './FunctionsPage.scss';

const FunctionsListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  return params.ns ? (
    <KnativeServiceTypeContext.Provider value={ServiceTypeValue.Function}>
      <Helmet>
        <title>{t('knative-plugin~Functions')}</title>
      </Helmet>
      <div className="odc-functions-list-page__heading">
        <PageHeading title={t('knative-plugin~Functions')} />
        <div className="co-m-nav-title">
          <CreateActionDropdown />
        </div>
      </div>
      <GettingStartedSection />
      <ListPage
        showTitle={false}
        {...props}
        kind={referenceForModel(ServiceModel)}
        ListComponent={FunctionsList}
        selector={{ matchLabels: { 'function.knative.dev': 'true' } }}
      />
    </KnativeServiceTypeContext.Provider>
  ) : (
    <CreateProjectListPage title={t('knative-plugin~Functions')}>
      {(openProjectModal) => (
        <Trans t={t} ns="knative-plugin">
          Select a Project to view its details
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(FunctionsListPage);

const FunctionsPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  );
};

export default FunctionsPage;
