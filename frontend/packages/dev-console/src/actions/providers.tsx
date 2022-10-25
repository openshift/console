import * as React from 'react';
import { GraphElement, Node, isGraph } from '@patternfly/react-topology';
import i18next from 'i18next';
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
  FLAGS,
  isCatalogTypeEnabled,
  useActiveNamespace,
  useFlag,
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
  const actions = React.useMemo(() => {
    let commonActions: Action[];
    if (resource.spec.application.labelSelector) {
      const message = (
        <p>
          {i18next.t(
            'devconsole~Deletion of a Service Binding resource that utilizes label selector will result in the removal of all bindings on applications that share the labels defined in the Service Binding resource.',
          )}
        </p>
      );
      commonActions = getCommonResourceActions(k8sKind, resource, message);
    } else {
      commonActions = getCommonResourceActions(k8sKind, resource);
    }

    return commonActions;
  }, [k8sKind, resource]);
  return [actions, !inFlight, undefined];
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
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);
  const developerCatalogFlag = useFlag(FLAG_DEVELOPER_CATALOG);
  const sampleCatalogFlag = useFlag(FLAG_SAMPLE_CATALOG_TYPE);
  const operatorBackedServiceCatalogFlag = useFlag(FLAG_OPERATOR_BACKED_SERVICE_CATALOG_TYPE);

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
    if (!isGraph(element)) {
      return [[], true, undefined];
    }

    const sourceObj = connectorSource?.getData()?.resource;
    const sourceReference = sourceObj
      ? `${referenceFor(sourceObj)}/${sourceObj?.metadata?.name}`
      : undefined;

    const actions: Action[] = [];

    if (sourceReference) {
      if (openshiftFlag) {
        actions.push(
          AddActions.FromGit(namespace, undefined, sourceReference, '', !isImportResourceAccess),
          AddActions.ContainerImage(
            namespace,
            undefined,
            sourceReference,
            '',
            !isCatalogImageResourceAccess,
          ),
        );
      }
      if (
        developerCatalogFlag &&
        operatorBackedServiceCatalogFlag &&
        isOperatorBackedServiceEnabled
      ) {
        actions.push(
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
      if (openshiftFlag) {
        actions.push(
          AddActions.UploadJarFile(
            namespace,
            undefined,
            sourceReference,
            '',
            !isCatalogImageResourceAccess,
          ),
        );
      }
    } else {
      if (developerCatalogFlag && sampleCatalogFlag && isSampleTypeEnabled) {
        actions.push(
          AddActions.Samples(
            namespace,
            undefined,
            undefined,
            ADD_TO_PROJECT,
            !isImportResourceAccess,
          ),
        );
      }
      if (openshiftFlag) {
        actions.push(
          AddActions.FromGit(
            namespace,
            undefined,
            undefined,
            ADD_TO_PROJECT,
            !isImportResourceAccess,
          ),
          AddActions.ContainerImage(
            namespace,
            undefined,
            undefined,
            ADD_TO_PROJECT,
            !isCatalogImageResourceAccess,
          ),
        );
      }
      if (isDevCatalogEnabled) {
        actions.push(
          AddActions.DevCatalog(namespace, undefined, undefined, ADD_TO_PROJECT, undefined),
          AddActions.DatabaseCatalog(namespace, undefined, undefined, ADD_TO_PROJECT, undefined),
        );
      }
      if (
        developerCatalogFlag &&
        operatorBackedServiceCatalogFlag &&
        isOperatorBackedServiceEnabled
      ) {
        actions.push(
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
      if (openshiftFlag) {
        actions.push(
          AddActions.UploadJarFile(
            namespace,
            undefined,
            undefined,
            ADD_TO_PROJECT,
            !isCatalogImageResourceAccess,
          ),
        );
      }
    }

    return [actions.filter(disabledActionsFilter), true, undefined];
  }, [
    element,
    connectorSource,
    openshiftFlag,
    isOperatorBackedServiceEnabled,
    namespace,
    isImportResourceAccess,
    isCatalogImageResourceAccess,
    serviceBindingAccess,
    developerCatalogFlag,
    sampleCatalogFlag,
    operatorBackedServiceCatalogFlag,
    isSampleTypeEnabled,
    isDevCatalogEnabled,
  ]);
};

export const useTopologyApplicationActionProvider: TopologyActionProvider = ({
  element,
  connectorSource,
}) => {
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);
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

      const actions: Action[] = [];

      if (!connectorSource) {
        actions.push(DeleteApplicationAction(appData, kindObj));
      }
      if (openshiftFlag) {
        actions.push(
          AddActions.FromGit(
            namespace,
            application,
            sourceReference,
            path,
            !isImportResourceAccess,
          ),
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
        );
      }

      return [actions.filter(disabledActionsFilter), !inFlight, undefined];
    }
    return [[], true, undefined];
  }, [
    element,
    inFlight,
    connectorSource,
    openshiftFlag,
    namespace,
    application,
    isImportResourceAccess,
    isCatalogImageResourceAccess,
    appData,
    kindObj,
  ]);
};
