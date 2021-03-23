import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import {
  getHealthChecksData,
  getProbesData,
} from '@console/dev-console/src/components/health-checks/create-health-checks-probe-utils';
import {
  DeployImageFormData,
  Resources,
} from '@console/dev-console/src/components/import/import-types';
import { ensurePortExists } from '@console/dev-console/src/components/import/deployImage-submit-utils';
import {
  deployImageInitialValues,
  getDeploymentData,
  getExternalImagelValues,
  getIconInitialValues,
  getKsvcRouteData,
  getServerlessData,
  getUserLabels,
} from '@console/dev-console/src/components/edit-application/edit-application-utils';
import { getLimitsDataFromResource } from '@console/shared/src';
import { RegistryType } from '@console/dev-console/src/utils/imagestream-utils';
import { ServiceModel } from '../models';
import { getKnativeServiceDepResource } from './create-knative-utils';
import { KNATIVE_MAXSCALE_ANNOTATION, KNATIVE_MINSCALE_ANNOTATION } from '../const';

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

  const newKnativeDeployResource: K8sResourceKind = {
    kind: ServiceModel.kind,
    apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
    metadata: {
      name,
      namespace,
      labels,
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

export const knatifyResources = (rawFormData: DeployImageFormData): Promise<K8sResourceKind> => {
  const formData = ensurePortExists(rawFormData);
  const {
    isi: { image },
  } = formData;
  const imageStreamUrl: string = image?.dockerImageReference ?? '';
  const knDeploymentResource = getKnativeServiceDepResource(formData, imageStreamUrl);
  return k8sCreate(ServiceModel, knDeploymentResource);
};

export const getCommonInitialValues = (
  ksvcResourceData: K8sResourceKind,
  name: string,
  namespace: string,
) => {
  const appGroupName = ksvcResourceData?.metadata?.labels?.[PART_OF] ?? '';
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
  appName: string,
  namespace: string,
  imageStreams: K8sResourceKind[],
): DeployImageFormData => {
  const commonValues = getCommonInitialValues(ksvcResourceData, appName, namespace);
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
