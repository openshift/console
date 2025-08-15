import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src';
import { ListPage } from '@console/internal/components/factory';
import { withStartGuide } from '@console/internal/components/start-guide';
import { referenceForModel } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { ServiceModel } from '../../models';
import { ServiceTypeValue } from '../../types';
import { CreateActionDropdown } from './CreateActionDropdown';
import FunctionsList from './FunctionsList';
import { GettingStartedSection } from './GettingStartedSection';
import { KnativeServiceTypeContext } from './ServiceTypeContext';

import './FunctionsPage.scss';

const FunctionList: React.FC<{ namespace: string }> = (props) => {
  const { t } = useTranslation();
  return (
    <KnativeServiceTypeContext.Provider value={ServiceTypeValue.Function}>
      <DocumentTitle>{t('knative-plugin~Functions')}</DocumentTitle>
      <PageHeading
        title={t('knative-plugin~Functions')}
        primaryAction={<CreateActionDropdown namespace={props.namespace} />}
      />
      <GettingStartedSection />
      <ListPage
        showTitle={false}
        {...props}
        kind={referenceForModel(ServiceModel)}
        ListComponent={FunctionsList}
        selector={{ matchLabels: { 'function.knative.dev': 'true' } }}
      />
    </KnativeServiceTypeContext.Provider>
  );
};

const FunctionsListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  const { ns } = useParams();
  const [perspective] = useActivePerspective();
  return perspective === 'dev' ? (
    ns ? (
      <FunctionList namespace={ns} {...props} />
    ) : (
      <CreateProjectListPage title={t('knative-plugin~Functions')}>
        {(openProjectModal) => (
          <Trans t={t} ns="knative-plugin">
            Select a Project to view its details
            <CreateAProjectButton openProjectModal={openProjectModal} />.
          </Trans>
        )}
      </CreateProjectListPage>
    )
  ) : (
    <FunctionList namespace={ns ?? ''} {...props} />
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
