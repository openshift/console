import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { useTabbedTableBreadcrumbsFor } from '@console/dynamic-plugin-sdk';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src/shared/hooks/useActivePerspective';
import { K8sKind } from '@console/internal/module/k8s';
import { CamelKameletBindingModel } from '../models';
import { getEventSourceModels } from '../utils/fetch-dynamic-eventsources-utils';
import { serverlessTab } from '../utils/serverless-tab-utils';

export const useEventSourceDetailPageBreadcrumbs = (kindObj: K8sKind, urlMatch: match<any>) => {
  const { t } = useTranslation();
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  return useTabbedTableBreadcrumbsFor(
    kindObj,
    urlMatch,
    'eventing',
    serverlessTab('EventSource'),
    isAdminPerspective ? t('knative-plugin~Event Sources') : undefined,
  );
};

export const getEventSourceModelsForBreadcrumbs = () => {
  return [...getEventSourceModels(), CamelKameletBindingModel];
};
