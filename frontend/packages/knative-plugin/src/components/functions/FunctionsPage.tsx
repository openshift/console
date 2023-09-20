import * as React from 'react';
import Helmet from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { ListPage } from '@console/internal/components/factory';
import { withStartGuide } from '@console/internal/components/start-guide';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import { ServiceTypeValue } from '../../types';
import FunctionsList from './FunctionsList';
import { KnativeServiceTypeContext } from './ServiceTypeContext';

const FunctionsListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  const {
    params: { ns: namespace },
  } = props.match;
  return namespace ? (
    <KnativeServiceTypeContext.Provider value={ServiceTypeValue.Function}>
      <Helmet>
        <title>{t('knative-plugin~Functions')}</title>
      </Helmet>
      <ListPage
        title={t('knative-plugin~Functions')}
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
