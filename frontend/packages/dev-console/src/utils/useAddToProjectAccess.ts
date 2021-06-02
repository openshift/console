import * as React from 'react';
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
import { AccessReviewResourceAttributes, K8sKind } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared';
import { ALLOW_SERVICE_BINDING_FLAG } from '@console/topology/src/const';
import { allCatalogImageResourceAccess, allImportResourceAccess } from '../actions/add-resources';
import { SERVICE_BINDING_ENABLED } from '../const';

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

  const serviceBindingEnabled = useFlag(ALLOW_SERVICE_BINDING_FLAG);

  return React.useMemo(() => {
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
    if (serviceBindingEnabled) {
      createResourceAccess.push(SERVICE_BINDING_ENABLED);
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
    serviceBindingEnabled,
  ]);
};
