import * as React from 'react';
import { GraphElement, Node, isGraph } from '@patternfly/react-topology';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
import { K8sModel, Action, SetFeatureFlag } from '@console/dynamic-plugin-sdk';
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
import { ServiceBindingModel } from '@console/service-binding-plugin/src/models';
import {
  isCatalogTypeEnabled,
  useActiveNamespace,
  useIsDeveloperCatalogEnabled,
} from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { TYPE_APPLICATION_GROUP } from '@console/topology/src/const';
import {
  FLAG_DEVELOPER_CATALOG,
  FLAG_OPERATOR_BACKED_SERVICE_CATALOG_TYPE,
  FLAG_SAMPLE_CATALOG_TYPE,
  OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID,
  SAMPLE_CATALOG_TYPE_ID,
  ADD_TO_PROJECT,
} from '../const';
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

export const useDeveloperCatalogProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(FLAG_DEVELOPER_CATALOG, useIsDeveloperCatalogEnabled());
  setFeatureFlag(
    FLAG_OPERATOR_BACKED_SERVICE_CATALOG_TYPE,
    isCatalogTypeEnabled(OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID),
  );
  setFeatureFlag(FLAG_SAMPLE_CATALOG_TYPE, isCatalogTypeEnabled(SAMPLE_CATALOG_TYPE_ID));
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
  const isDevCatalogEnabled = useIsDeveloperCatalogEnabled();
  const isOperatorBackedServiceEnabled = isCatalogTypeEnabled(
    OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID,
  );
  const isSampleTypeEnabled = isCatalogTypeEnabled(SAMPLE_CATALOG_TYPE_ID);

  return React.useMemo(() => {
    const sourceObj = connectorSource?.getData()?.resource;
    const sourceReference = sourceObj
      ? `${referenceFor(sourceObj)}/${sourceObj?.metadata?.name}`
      : undefined;

    const actionsWithSourceRef: Action[] = [];
    actionsWithSourceRef.push(
      AddActions.FromGit(namespace, undefined, sourceReference, '', !isImportResourceAccess),
    );
    actionsWithSourceRef.push(
      AddActions.ContainerImage(
        namespace,
        undefined,
        sourceReference,
        '',
        !isCatalogImageResourceAccess,
      ),
    );
    if (isOperatorBackedServiceEnabled) {
      actionsWithSourceRef.push(
        AddActions.OperatorBacked(
          namespace,
          undefined,
          sourceReference,
          '',
          null,
          serviceBindingAccess,
        ),
      );
    }
    actionsWithSourceRef.push(
      AddActions.UploadJarFile(
        namespace,
        undefined,
        sourceReference,
        '',
        !isCatalogImageResourceAccess,
      ),
    );

    const actionsWithoutSourceRef: Action[] = [];
    if (isSampleTypeEnabled) {
      actionsWithoutSourceRef.push(
        AddActions.Samples(
          namespace,
          undefined,
          undefined,
          ADD_TO_PROJECT,
          !isImportResourceAccess,
        ),
      );
    }
    actionsWithoutSourceRef.push(
      AddActions.FromGit(namespace, undefined, undefined, ADD_TO_PROJECT, !isImportResourceAccess),
    );
    actionsWithoutSourceRef.push(
      AddActions.ContainerImage(
        namespace,
        undefined,
        undefined,
        ADD_TO_PROJECT,
        !isCatalogImageResourceAccess,
      ),
    );
    if (isDevCatalogEnabled) {
      actionsWithoutSourceRef.push(
        AddActions.DevCatalog(namespace, undefined, undefined, ADD_TO_PROJECT, undefined),
      );
      actionsWithoutSourceRef.push(
        AddActions.DatabaseCatalog(namespace, undefined, undefined, ADD_TO_PROJECT, undefined),
      );
    }
    if (isOperatorBackedServiceEnabled) {
      actionsWithoutSourceRef.push(
        AddActions.OperatorBacked(
          namespace,
          undefined,
          undefined,
          ADD_TO_PROJECT,
          undefined,
          undefined,
        ),
      );
    }
    actionsWithoutSourceRef.push(
      AddActions.UploadJarFile(
        namespace,
        undefined,
        undefined,
        ADD_TO_PROJECT,
        !isCatalogImageResourceAccess,
      ),
    );

    if (isGraph(element)) {
      const actions = sourceReference
        ? actionsWithSourceRef.filter(disabledActionsFilter)
        : actionsWithoutSourceRef.filter(disabledActionsFilter);
      return [actions, true, undefined];
    }
    return [[], true, undefined];
  }, [
    connectorSource,
    namespace,
    isImportResourceAccess,
    isCatalogImageResourceAccess,
    isOperatorBackedServiceEnabled,
    isSampleTypeEnabled,
    isDevCatalogEnabled,
    element,
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
      const sourceObj = connectorSource?.getData()?.resource;
      const sourceReference = sourceObj
        ? `${referenceFor(sourceObj)}/${sourceObj?.metadata?.name}`
        : undefined;
      const actions = [
        ...(connectorSource ? [] : [DeleteApplicationAction(appData, kindObj)]),
        AddActions.FromGit(namespace, application, sourceReference, path, !isImportResourceAccess),
        AddActions.ContainerImage(
          namespace,
          application,
          sourceReference,
          path,
          !isCatalogImageResourceAccess,
        ),
        AddActions.UploadJarFile(
          namespace,
          application,
          sourceReference,
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
