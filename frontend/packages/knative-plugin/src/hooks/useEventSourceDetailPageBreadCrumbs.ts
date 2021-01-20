import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { modelFor } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useActivePerspective } from '@console/shared/src/hooks/useActivePerspective';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import { match } from 'react-router';
import { CamelKameletBindingModel } from '../models';
import {
  getDynamicEventSourceModel,
  getEventSourceModels,
} from '../utils/fetch-dynamic-eventsources-utils';

export const useEventSourceDetailPageBreadCrumbs = (kind: string, urlMatch: match<any>) => {
  const { t } = useTranslation();
  const { label, labelPlural } = getDynamicEventSourceModel(kind) ?? modelFor(kind);
  const currentNamespace = useActiveNamespace()[0];
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const nsURL =
    ALL_NAMESPACES_KEY === currentNamespace ? 'all-namespaces' : `ns/${currentNamespace}`;
  return useMemo(
    () => [
      {
        name: isAdminPerspective ? 'Event Sources' : labelPlural,
        path: isAdminPerspective ? `/eventing/${nsURL}` : getBreadcrumbPath(urlMatch),
      },
      { name: t('console-shared~{{label}} Details', { label }), path: urlMatch.url },
    ],
    [isAdminPerspective, labelPlural, nsURL, urlMatch, t, label],
  );
};

export const getEventSourceModelsForBreadcrumbs = () => [
  ...getEventSourceModels(),
  CamelKameletBindingModel,
];
