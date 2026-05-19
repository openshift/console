import { useMemo } from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ImageStreamTagModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';

const NON_SCALABLE_LABEL = 'io.openshift.non-scalable';
const IMAGE_TRIGGER_ANNOTATION = 'image.openshift.io/triggers';

type ISTReference = {
  name: string;
  namespace: string;
};

type ImageStreamTagResource = K8sResourceKind & {
  image?: {
    dockerImageMetadata?: {
      Config?: {
        Labels?: Record<string, string>;
      };
    };
  };
};

const getISTFromDeploymentConfig = (resource: K8sResourceKind): ISTReference | null => {
  const triggers = resource?.spec?.triggers;
  if (!Array.isArray(triggers)) {
    return null;
  }
  const imageChangeTrigger = triggers.find(
    (trigger) =>
      trigger.type === 'ImageChange' &&
      trigger?.imageChangeParams?.from?.kind === 'ImageStreamTag' &&
      !!trigger?.imageChangeParams?.from?.name,
  );
  if (!imageChangeTrigger) {
    return null;
  }
  const { name, namespace } = imageChangeTrigger.imageChangeParams.from;
  return {
    name,
    namespace: namespace || resource.metadata?.namespace,
  };
};

const getISTFromTriggerAnnotation = (resource: K8sResourceKind): ISTReference | null => {
  const annotation = resource?.metadata?.annotations?.[IMAGE_TRIGGER_ANNOTATION];
  if (!annotation) {
    return null;
  }
  try {
    const triggers = JSON.parse(annotation);
    const trigger = Array.isArray(triggers)
      ? triggers.find((t) => t?.from?.kind === 'ImageStreamTag' && !!t?.from?.name)
      : null;
    if (!trigger) {
      return null;
    }
    return {
      name: trigger.from.name,
      namespace: trigger.from.namespace || resource.metadata?.namespace,
    };
  } catch {
    return null;
  }
};

const getISTReference = (resource: K8sResourceKind): ISTReference | null => {
  if (resource?.kind === 'DeploymentConfig') {
    return getISTFromDeploymentConfig(resource);
  }
  return getISTFromTriggerAnnotation(resource);
};

/**
 * Checks if a workload's container image has the `io.openshift.non-scalable` label.
 * Resolves the ImageStreamTag reference from the workload's triggers or annotations,
 * watches the IST via `useK8sWatchResource`, and inspects
 * `image.dockerImageMetadata.Config.Labels`.
 *
 * Pass `null` to skip the watch (e.g. for non-replica paths).
 * Returns `{ isNonScalable: false }` silently on any error (missing IST, permissions, etc.).
 */
export const useNonScalableImageCheck = (
  resource: K8sResourceKind | null,
): { isNonScalable: boolean; loading: boolean } => {
  const triggerAnnotation = resource?.metadata?.annotations?.[IMAGE_TRIGGER_ANNOTATION];
  const resourceKind = resource?.kind;
  const resourceNamespace = resource?.metadata?.namespace;
  const dcISTName = resource?.spec?.triggers?.find(
    (t) => t?.type === 'ImageChange' && t?.imageChangeParams?.from?.kind === 'ImageStreamTag',
  )?.imageChangeParams?.from?.name;

  const istRef = useMemo(
    () => (resource ? getISTReference(resource) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resourceKind, resourceNamespace, triggerAnnotation, dcISTName],
  );

  const istName = istRef?.name;
  const istNamespace = istRef?.namespace;

  const [ist, loaded, error] = useK8sWatchResource<ImageStreamTagResource>(
    istName && istNamespace
      ? {
          kind: ImageStreamTagModel.kind,
          name: istName,
          namespace: istNamespace,
          isList: false,
        }
      : null,
  );

  const isNonScalable =
    loaded && !error
      ? ist?.image?.dockerImageMetadata?.Config?.Labels?.[NON_SCALABLE_LABEL] === 'true'
      : false;

  return { isNonScalable, loading: !loaded };
};
