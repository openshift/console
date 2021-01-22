import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { K8sKind } from '@console/internal/module/k8s';
import { useActivePerspective } from '@console/shared/src/hooks/useActivePerspective';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { serverlessTab } from '../utils/serverless-tab-utils';
import { getEventSourceModels } from '../utils/fetch-dynamic-eventsources-utils';
import { CamelKameletBindingModel } from '../models';

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
