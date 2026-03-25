import { useMemo } from 'react';
import { useAccessReview } from '@console/internal/components/utils';
import {
  BuildConfigModel,
  DeploymentConfigModel,
  ImageStreamImportsModel,
  ImageStreamModel,
  RouteModel,
  SecretModel,
  ServiceModel,
} from '@console/internal/models';
import type { AccessReviewResourceAttributes, K8sKind } from '@console/internal/module/k8s';
import { allCatalogImageResourceAccess, allImportResourceAccess } from '../actions/add-resources';

const resourceAttributes = (model: K8sKind, namespace: string): AccessReviewResourceAttributes => {
  return {
    group: model.apiGroup || '',
    resource: model.plural,
    namespace,
    verb: 'create',
  };
};

export const useAddToProjectAccess = (activeNamespace: string): string[] => {
  const buildConfigsAccess = useAccessReview(resourceAttributes(BuildConfigModel, activeNamespace));
  const imageStreamAccess = useAccessReview(resourceAttributes(ImageStreamModel, activeNamespace));
  const deploymentConfigAccess = useAccessReview(
    resourceAttributes(DeploymentConfigModel, activeNamespace),
  );
  const imageStreamImportAccess = useAccessReview(
    resourceAttributes(ImageStreamImportsModel, activeNamespace),
  );
  const secretAccess = useAccessReview(resourceAttributes(SecretModel, activeNamespace));
  const routeAccess = useAccessReview(resourceAttributes(RouteModel, activeNamespace));
  const serviceAccess = useAccessReview(resourceAttributes(ServiceModel, activeNamespace));

  return useMemo(() => {
    const createResourceAccess: string[] = [];
    if (
      buildConfigsAccess &&
      imageStreamAccess &&
      deploymentConfigAccess &&
      secretAccess &&
      routeAccess &&
      serviceAccess
    ) {
      createResourceAccess.push(allImportResourceAccess);
      if (imageStreamImportAccess) {
        createResourceAccess.push(allCatalogImageResourceAccess);
      }
    }
    return createResourceAccess;
  }, [
    buildConfigsAccess,
    deploymentConfigAccess,
    imageStreamAccess,
    imageStreamImportAccess,
    routeAccess,
    secretAccess,
    serviceAccess,
  ]);
};
