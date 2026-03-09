import { useMemo } from 'react';
import type { GraphElement, Node } from '@patternfly/react-topology';
import { isGraph } from '@patternfly/react-topology';
import type { K8sModel, Action, SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import type { TopologyApplicationObject } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
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
import type { AccessReviewResourceAttributes, K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import {
  isCatalogTypeEnabled,
  useActiveNamespace,
  useFlag,
  useIsSoftwareCatalogEnabled,
} from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { TYPE_APPLICATION_GROUP } from '@console/topology/src/const';
import { useJavaImageStreamEnabled } from '../components/import/jar/useJavaImageStreamEnabled';
import {
  FLAG_DEVELOPER_CATALOG,
  FLAG_JAVA_IMAGE_STREAM_ENABLED,
  FLAG_OPERATOR_BACKED_SERVICE_CATALOG_TYPE,
  FLAG_SAMPLE_CATALOG_TYPE,
  OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID,
  SAMPLE_CATALOG_TYPE_ID,
  ADD_TO_PROJECT,
} from '../const';
import { AddActions, disabledActionsFilter } from './add-resources';
import { useDeleteApplicationAction } from './context-menu';
import { EditImportApplication } from './creators';

type TopologyActionProvider = (data: {
  element: GraphElement;
  connectorSource?: Node;
}) => [Action[], boolean, Error];

export const useEditImportActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const editImportAction = useMemo(() => {
    const annotation = resource?.metadata?.annotations?.['openshift.io/generated-by'];
    const isFromDevfile = resource?.metadata?.annotations?.isFromDevfile;
    const hideEditImportAction = annotation !== 'OpenShiftWebConsole' || !!isFromDevfile;

    return hideEditImportAction ? [] : EditImportApplication(kindObj, resource);
  }, [kindObj, resource]);

  return [editImportAction, !inFlight, undefined];
};

const resourceAttributes = (model: K8sModel, namespace: string): AccessReviewResourceAttributes => {
  return {
    group: model.apiGroup || '',
    resource: model.plural,
    namespace,
    verb: 'create',
  };
};

export const useSoftwareCatalogProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(FLAG_DEVELOPER_CATALOG, useIsSoftwareCatalogEnabled());
  setFeatureFlag(
    FLAG_OPERATOR_BACKED_SERVICE_CATALOG_TYPE,
    isCatalogTypeEnabled(OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID),
  );
  setFeatureFlag(FLAG_SAMPLE_CATALOG_TYPE, isCatalogTypeEnabled(SAMPLE_CATALOG_TYPE_ID));
  setFeatureFlag(FLAG_JAVA_IMAGE_STREAM_ENABLED, useJavaImageStreamEnabled());
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
  const isImportResourceAccess =
    buildConfigsAccess &&
    imageStreamAccess &&
    deploymentConfigAccess &&
    secretAccess &&
    routeAccess &&
    serviceAccess;
  const isCatalogImageResourceAccess = isImportResourceAccess && imageStreamImportAccess;
  const isSoftwareCatalogEnabled = useIsSoftwareCatalogEnabled();
  const isOperatorBackedServiceEnabled = isCatalogTypeEnabled(
    OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID,
  );
  const isSampleTypeEnabled = isCatalogTypeEnabled(SAMPLE_CATALOG_TYPE_ID);
  const isServerlessEnabled = useFlag('KNATIVE_SERVING_SERVICE');
  const isJavaImageStreamEnabled = useFlag('JAVA_IMAGE_STREAM_ENABLED');

  return useMemo(() => {
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
        AddActions.OperatorBacked(namespace, undefined, sourceReference, '', null),
      );
    }
    if (isJavaImageStreamEnabled) {
      actionsWithSourceRef.push(
        AddActions.UploadJarFile(
          namespace,
          undefined,
          sourceReference,
          '',
          !isCatalogImageResourceAccess,
        ),
      );
    }
    // Tech debt: ODC-7413: Move Serverless specific actions and providers from devconsole into knative-pluigin
    if (isServerlessEnabled) {
      actionsWithSourceRef.push(
        AddActions.CreateServerlessFunction(
          namespace,
          undefined,
          sourceReference,
          '',
          !isCatalogImageResourceAccess,
        ),
        AddActions.CreateServerlessFunctionUsingSamples(
          namespace,
          undefined,
          sourceReference,
          '',
          !isCatalogImageResourceAccess,
        ),
      );
    }

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
    if (isSoftwareCatalogEnabled) {
      actionsWithoutSourceRef.push(
        AddActions.SoftwareCatalog(namespace, undefined, undefined, ADD_TO_PROJECT, undefined),
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
    if (isJavaImageStreamEnabled) {
      actionsWithoutSourceRef.push(
        AddActions.UploadJarFile(
          namespace,
          undefined,
          undefined,
          ADD_TO_PROJECT,
          !isCatalogImageResourceAccess,
        ),
      );
    }
    // Tech debt: ODC-7413: Move Serverless specific actions and providers from devconsole into knative-pluigin
    if (isServerlessEnabled) {
      actionsWithoutSourceRef.push(
        AddActions.CreateServerlessFunction(
          namespace,
          undefined,
          undefined,
          ADD_TO_PROJECT,
          !isCatalogImageResourceAccess,
        ),
        AddActions.CreateServerlessFunctionUsingSamples(
          namespace,
          undefined,
          undefined,
          ADD_TO_PROJECT,
          !isCatalogImageResourceAccess,
        ),
      );
    }

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
    isServerlessEnabled,
    isJavaImageStreamEnabled,
    isSampleTypeEnabled,
    isSoftwareCatalogEnabled,
    element,
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
  const isServerlessEnabled = useFlag('KNATIVE_SERVING_SERVICE');
  const isJavaImageStreamEnabled = useFlag('JAVA_IMAGE_STREAM_ENABLED');
  const application = element.getLabel();
  const appData: TopologyApplicationObject = useMemo(
    () => ({
      id: element.getId(),
      name: application,
      resources: element.getData()?.groupResources,
    }),
    [element, application],
  );
  const primaryResource = appData.resources?.[0]?.resource || {};
  const [kindObj, inFlight] = useK8sModel(referenceFor(primaryResource));
  const deleteApplicationAction = useDeleteApplicationAction(appData, kindObj);

  return useMemo(() => {
    if (element.getType() === TYPE_APPLICATION_GROUP) {
      if (inFlight) return [[], !inFlight, undefined];
      const path = connectorSource ? '' : 'add-to-application';
      const sourceObj = connectorSource?.getData()?.resource;
      const sourceReference = sourceObj
        ? `${referenceFor(sourceObj)}/${sourceObj?.metadata?.name}`
        : undefined;
      const actions = [
        ...(connectorSource ? [] : [deleteApplicationAction]),
        AddActions.FromGit(namespace, application, sourceReference, path, !isImportResourceAccess),
        AddActions.ContainerImage(
          namespace,
          application,
          sourceReference,
          path,
          !isCatalogImageResourceAccess,
        ),
        ...(isJavaImageStreamEnabled
          ? [
              AddActions.UploadJarFile(
                namespace,
                application,
                sourceReference,
                path,
                !isCatalogImageResourceAccess,
              ),
            ]
          : []),
        // Tech debt: ODC-7413: Move Serverless specific actions and providers from devconsole into knative-pluigin
        ...(isServerlessEnabled
          ? [
              AddActions.CreateServerlessFunction(
                namespace,
                application,
                sourceReference,
                path,
                !isCatalogImageResourceAccess,
              ),
              AddActions.CreateServerlessFunctionUsingSamples(
                namespace,
                application,
                sourceReference,
                path,
                !isCatalogImageResourceAccess,
              ),
            ]
          : []),
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
    isServerlessEnabled,
    isJavaImageStreamEnabled,
    deleteApplicationAction,
  ]);
};
