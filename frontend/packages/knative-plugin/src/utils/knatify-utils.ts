import {
  deployImageInitialValues,
  getDeploymentData,
  getExternalImagelValues,
  getIconInitialValues,
  getKsvcRouteData,
  getServerlessData,
  getUserLabels,
} from '@console/dev-console/src/components/edit-application/edit-application-utils';
import {
  getHealthChecksData,
  getProbesData,
} from '@console/dev-console/src/components/health-checks/create-health-checks-probe-utils';
import { ensurePortExists } from '@console/dev-console/src/components/import/deployImage-submit-utils';
import {
  DeployImageFormData,
  Resources,
} from '@console/dev-console/src/components/import/import-types';
import { RegistryType } from '@console/dev-console/src/utils/imagestream-utils';
import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import { getLimitsDataFromResource } from '@console/shared/src';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { KNATIVE_MAXSCALE_ANNOTATION, KNATIVE_MINSCALE_ANNOTATION } from '../const';
import { ServiceModel } from '../models';
import { getKnativeServiceDepResource } from './create-knative-utils';

const PART_OF = 'app.kubernetes.io/part-of';
const knatify = 'knatify';

export const getKnatifyWorkloadData = (obj: K8sResourceKind, relatedHpa?: K8sResourceKind) => {
  const { metadata, spec } = obj || {};
  const { name = '', namespace = '', labels = {}, annotations = {} } = metadata || {};
  const { metadata: templateMetadata, spec: templateSpec } = spec?.template || {};
  const { image, ports, imagePullPolicy, env, resources } = templateSpec?.containers[0] || {};
  const { spec: hpaSpec } = relatedHpa ?? {};

  const healthChecks = getHealthChecksData(obj, 0);
  const { readinessProbe, livenessProbe } = getProbesData(healthChecks, Resources.KnativeService);
  const appName = `ksvc-${name}`;
  const newKnativeDeployResource: K8sResourceKind = {
    kind: ServiceModel.kind,
    apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
    metadata: {
      name: appName,
      namespace,
      labels: {
        ...labels,
        'app.kubernetes.io/instance': appName,
        'app.kubernetes.io/component': appName,
      },
      annotations,
    },
    spec: {
      template: {
        metadata: {
          labels: templateMetadata?.labels ?? {},
          annotations: {
            ...templateMetadata?.annotations,
            ...(hpaSpec?.minReplicas && {
              [KNATIVE_MINSCALE_ANNOTATION]: `${hpaSpec.minReplicas}`,
            }),
            ...(hpaSpec?.maxReplicas && {
              [KNATIVE_MAXSCALE_ANNOTATION]: `${hpaSpec.maxReplicas}`,
            }),
          },
        },
        spec: {
          containers: [
            {
              name,
              image,
              ...(ports?.length > 0 && {
                ports: [
                  {
                    containerPort: ports[0]?.containerPort,
                  },
                ],
              }),
              ...(imagePullPolicy && {
                imagePullPolicy,
              }),
              ...(env?.length > 0 && { env }),
              ...(resources && { resources }),
              ...(readinessProbe && {
                readinessProbe,
              }),
              ...(livenessProbe && {
                livenessProbe,
              }),
            },
          ],
        },
      },
    },
  };
  return newKnativeDeployResource;
};

export const knatifyResources = (
  rawFormData: DeployImageFormData,
  appName: string,
): Promise<K8sResourceKind> => {
  const formData = ensurePortExists(rawFormData);
  const {
    isi: { image },
  } = formData;
  const imageStreamUrl: string = image?.dockerImageReference ?? '';
  const knDeploymentRes = getKnativeServiceDepResource(
    formData,
    imageStreamUrl,
    undefined,
    undefined,
    undefined,
    formData.annotations,
  );
  const knDeploymentResource = {
    ...knDeploymentRes,
    metadata: {
      ...knDeploymentRes.metadata,
      labels: {
        ...knDeploymentRes.metadata.labels,
        ...(!!appName && { 'app.kubernetes.io/name': appName }),
      },
    },
  };
  return k8sCreate(ServiceModel, knDeploymentResource);
};

export const getCommonInitialValues = (ksvcResourceData: K8sResourceKind, namespace: string) => {
  const appGroupName = ksvcResourceData?.metadata?.labels?.[PART_OF] ?? '';
  const name = ksvcResourceData?.metadata?.name ?? '';
  const commonInitialValues = {
    name,
    formType: knatify,
    application: {
      name: appGroupName || '',
      selectedKey: appGroupName || UNASSIGNED_KEY,
    },
    project: {
      name: namespace,
    },
    route: getKsvcRouteData(ksvcResourceData),
    resources: Resources.KnativeService,
    serverless: getServerlessData(ksvcResourceData),
    pipeline: {
      enabled: false,
    },
    deployment: getDeploymentData(ksvcResourceData),
    labels: getUserLabels(ksvcResourceData),
    limits: getLimitsDataFromResource(ksvcResourceData),
    healthChecks: getHealthChecksData(ksvcResourceData),
    annotations: ksvcResourceData?.metadata?.annotations ?? {},
  };
  return commonInitialValues;
};

const getInternalImageInitialValues = (
  editAppResource: K8sResourceKind,
  namespace: string,
  imageStreams: K8sResourceKind[],
) => {
  const [, isSha] = editAppResource.spec?.template?.spec?.containers?.[0]?.image?.split('@') ?? [];
  const { tag, image } = imageStreams.reduce(
    (acc, is) => {
      const tagData =
        isSha &&
        is.status?.tags?.find((t) => {
          const itemData = t.items?.find((it) => it.image === isSha);
          return !!itemData;
        });
      if (tagData) {
        return {
          tag: tagData.tag,
          image: is.metadata.name,
        };
      }
      return acc;
    },
    { tag: '', image: '' },
  );
  return {
    ...deployImageInitialValues,
    registry: RegistryType.Internal,
    imageStream: {
      image,
      tag,
      namespace,
    },
  };
};

export const getInitialValuesKnatify = (
  ksvcResourceData: K8sResourceKind,
  namespace: string,
  imageStreams: K8sResourceKind[],
): DeployImageFormData => {
  const commonValues = getCommonInitialValues(ksvcResourceData, namespace);
  const iconValues = getIconInitialValues(ksvcResourceData);
  const internalImageValues = getInternalImageInitialValues(
    ksvcResourceData,
    namespace,
    imageStreams,
  );
  const {
    imageStream: { image, tag },
  } = internalImageValues;
  const isInternalImageValid = image && tag && namespace;
  const externalImageValues = getExternalImagelValues(ksvcResourceData);
  return {
    ...commonValues,
    ...iconValues,
    ...(!!isInternalImageValid && internalImageValues),
    ...(!isInternalImageValid && externalImageValues),
  };
};
