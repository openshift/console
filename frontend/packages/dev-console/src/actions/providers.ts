import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
import { K8sKind } from '@console/dynamic-plugin-sdk/src';
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
import {
  AccessReviewResourceAttributes,
  K8sResourceKind,
  referenceFor,
} from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { TYPE_APPLICATION_GROUP } from '@console/topology/src/const';
import { getDisabledAddActions } from '../utils/useAddActionExtensions';
import { AddActions } from './add-actions';
import { EditImportApplication } from './creators';

export const useEditImportActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const editImportAction = React.useMemo(() => {
    const annotation = resource?.metadata?.annotations?.['openshift.io/generated-by'];
    const isFromDevfile = resource?.metadata?.annotations?.isFromDevfile;
    const hideEditImportAction = annotation !== 'OpenShiftWebConsole' || !!isFromDevfile;

    return hideEditImportAction ? [] : EditImportApplication(kindObj, resource);
  }, [kindObj, resource]);

  return [editImportAction, !inFlight, undefined];
};

export const useServiceBindingActionProvider = (resource: K8sResourceKind) => {
  const [k8sKind, inFlight] = useK8sModel(referenceFor(resource));
  const action = React.useMemo(() => getCommonResourceActions(k8sKind, resource), [
    k8sKind,
    resource,
  ]);
  return [action, !inFlight, undefined];
};

const resourceAttributes = (model: K8sKind, namespace: string): AccessReviewResourceAttributes => {
  return {
    group: model.apiGroup || '',
    resource: model.plural,
    namespace,
    verb: 'create',
  };
};

export const useAddToApplicationActionProvider = (element: GraphElement) => {
  const [activeNamespace] = useActiveNamespace();
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
  const isImportResourceAccess =
    buildConfigsAccess &&
    imageStreamAccess &&
    deploymentConfigAccess &&
    secretAccess &&
    routeAccess &&
    serviceAccess;
  const isCatalogImageResourceAccess = isImportResourceAccess && imageStreamImportAccess;

  const actions = React.useMemo(() => {
    if (element.getType() !== TYPE_APPLICATION_GROUP) return undefined;
    const application = element.getLabel();
    return [
      AddActions.FromGit(
        activeNamespace,
        application,
        undefined,
        'add-to-application',
        isImportResourceAccess,
      ),
      AddActions.ContainerImage(
        activeNamespace,
        application,
        undefined,
        'add-to-application',
        isCatalogImageResourceAccess,
      ),
      AddActions.UploadJarFile(
        activeNamespace,
        application,
        undefined,
        'add-to-application',
        isCatalogImageResourceAccess,
      ),
    ];
  }, [activeNamespace, element, isCatalogImageResourceAccess, isImportResourceAccess]);

  const disabledActions = getDisabledAddActions();

  return React.useMemo(() => {
    if (actions) {
      return [actions.filter((item) => !disabledActions?.includes(item.id)), true, undefined];
    }
    return [[], true, undefined];
  }, [actions, disabledActions]);
};
