import * as React from 'react';
import { GraphElement, Node, isGraph } from '@patternfly/react-topology';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
import { K8sModel, Action } from '@console/dynamic-plugin-sdk';
import { TopologyApplicationObject } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
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
import { ServiceBindingModel } from '@console/topology/src/models';
import { AddActions, disabledActionsFilter } from './add-resources';
import { DeleteApplicationAction } from './context-menu';
import { EditImportApplication } from './creators';

type TopologyActionProvider = (data: {
  element: GraphElement;
  connectorSource?: Node;
}) => [Action[], boolean, Error];

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

const resourceAttributes = (model: K8sModel, namespace: string): AccessReviewResourceAttributes => {
  return {
    group: model.apiGroup || '',
    resource: model.plural,
    namespace,
    verb: 'create',
  };
};

export const useTopologyGraphActionProvider: TopologyActionProvider = ({
  element,
  connectorSource,
}) => {
  const [namespace] = useActiveNamespace();
  const buildConfigsAccess = useAccessReview(resourceAttributes(BuildConfigModel, namespace));
  const imageStreamAccess = useAccessReview(resourceAttributes(ImageStreamModel, namespace));
  const deploymentConfigAccess = useAccessReview(
    resourceAttributes(DeploymentConfigModel, namespace),
  );
  const imageStreamImportAccess = useAccessReview(
    resourceAttributes(ImageStreamImportsModel, namespace),
  );
  const secretAccess = useAccessReview(resourceAttributes(SecretModel, namespace));
  const routeAccess = useAccessReview(resourceAttributes(RouteModel, namespace));
  const serviceAccess = useAccessReview(resourceAttributes(ServiceModel, namespace));
  const serviceBindingAccess = useAccessReview(resourceAttributes(ServiceBindingModel, namespace));
  const isImportResourceAccess =
    buildConfigsAccess &&
    imageStreamAccess &&
    deploymentConfigAccess &&
    secretAccess &&
    routeAccess &&
    serviceAccess;
  const isCatalogImageResourceAccess = isImportResourceAccess && imageStreamImportAccess;

  return React.useMemo(() => {
    const sourceObj = connectorSource?.getData()?.resource;
    const sourceReference = sourceObj
      ? `${referenceFor(sourceObj)}/${sourceObj?.metadata?.name}`
      : undefined;
    if (isGraph(element)) {
      const actions = sourceReference
        ? [
            AddActions.FromGit(namespace, undefined, sourceReference, '', !isImportResourceAccess),
            AddActions.ContainerImage(
              namespace,
              undefined,
              sourceReference,
              '',
              !isCatalogImageResourceAccess,
            ),
            AddActions.OperatorBacked(
              namespace,
              undefined,
              sourceReference,
              '',
              null,
              serviceBindingAccess,
            ),
            AddActions.UploadJarFile(
              namespace,
              undefined,
              sourceReference,
              '',
              !isCatalogImageResourceAccess,
            ),
          ].filter(disabledActionsFilter)
        : [
            AddActions.Samples(
              namespace,
              undefined,
              undefined,
              'add-to-project',
              !isImportResourceAccess,
            ),
            AddActions.FromGit(
              namespace,
              undefined,
              undefined,
              'add-to-project',
              !isImportResourceAccess,
            ),
            AddActions.ContainerImage(
              namespace,
              undefined,
              undefined,
              'add-to-project',
              !isCatalogImageResourceAccess,
            ),
            AddActions.DevCatalog(namespace, undefined, undefined, 'add-to-project'),
            AddActions.DatabaseCatalog(namespace, undefined, undefined, 'add-to-project'),
            AddActions.OperatorBacked(namespace, undefined, undefined, 'add-to-project'),
            AddActions.UploadJarFile(
              namespace,
              undefined,
              undefined,
              'add-to-project',
              !isCatalogImageResourceAccess,
            ),
          ].filter(disabledActionsFilter);
      return [actions, true, undefined];
    }
    return [[], true, undefined];
  }, [
    element,
    connectorSource,
    namespace,
    isImportResourceAccess,
    isCatalogImageResourceAccess,
    serviceBindingAccess,
  ]);
};

export const useTopologyApplicationActionProvider: TopologyActionProvider = ({
  element,
  connectorSource,
}) => {
  const [namespace] = useActiveNamespace();
  const buildConfigsAccess = useAccessReview(resourceAttributes(BuildConfigModel, namespace));
  const imageStreamAccess = useAccessReview(resourceAttributes(ImageStreamModel, namespace));
  const deploymentConfigAccess = useAccessReview(
    resourceAttributes(DeploymentConfigModel, namespace),
  );
  const imageStreamImportAccess = useAccessReview(
    resourceAttributes(ImageStreamImportsModel, namespace),
  );
  const secretAccess = useAccessReview(resourceAttributes(SecretModel, namespace));
  const routeAccess = useAccessReview(resourceAttributes(RouteModel, namespace));
  const serviceAccess = useAccessReview(resourceAttributes(ServiceModel, namespace));
  const isImportResourceAccess =
    buildConfigsAccess &&
    imageStreamAccess &&
    deploymentConfigAccess &&
    secretAccess &&
    routeAccess &&
    serviceAccess;
  const isCatalogImageResourceAccess = isImportResourceAccess && imageStreamImportAccess;

  const application = element.getLabel();
  const appData: TopologyApplicationObject = React.useMemo(
    () => ({
      id: element.getId(),
      name: application,
      resources: element.getData()?.groupResources,
    }),
    [element, application],
  );
  const primaryResource = appData.resources?.[0]?.resource || {};
  const [kindObj, inFlight] = useK8sModel(referenceFor(primaryResource));

  return React.useMemo(() => {
    if (element.getType() === TYPE_APPLICATION_GROUP) {
      if (inFlight) return [[], !inFlight, undefined];
      const path = connectorSource ? '' : 'add-to-application';
      const actions = [
        ...(connectorSource ? [] : [DeleteApplicationAction(appData, kindObj)]),
        AddActions.FromGit(namespace, application, undefined, path, !isImportResourceAccess),
        AddActions.ContainerImage(
          namespace,
          application,
          undefined,
          path,
          !isCatalogImageResourceAccess,
        ),
        AddActions.UploadJarFile(
          namespace,
          application,
          undefined,
          path,
          !isCatalogImageResourceAccess,
        ),
      ].filter(disabledActionsFilter);
      return [actions, !inFlight, undefined];
    }
    return [[], true, undefined];
  }, [
    element,
    inFlight,
    connectorSource,
    namespace,
    application,
    isImportResourceAccess,
    isCatalogImageResourceAccess,
    appData,
    kindObj,
  ]);
};
