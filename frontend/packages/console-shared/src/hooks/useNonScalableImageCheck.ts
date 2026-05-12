import { useState, useEffect, useMemo } from 'react';
import * as _ from 'lodash';
import { ImageStreamTagModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { k8sGet } from '@console/internal/module/k8s';

const NON_SCALABLE_LABEL = 'io.openshift.non-scalable';
const IMAGE_TRIGGER_ANNOTATION = 'image.openshift.io/triggers';

type ISTReference = {
  name: string;
  namespace: string;
};

const getISTFromDeploymentConfig = (resource: K8sResourceKind): ISTReference | null => {
  const triggers = resource?.spec?.triggers;
  if (!Array.isArray(triggers)) {
    return null;
  }
  const imageChangeTrigger = triggers.find((trigger) => trigger.type === 'ImageChange');
  if (!imageChangeTrigger?.imageChangeParams?.from?.name) {
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
    const trigger = Array.isArray(triggers) ? triggers[0] : null;
    if (!trigger?.from?.name || trigger.from.kind !== 'ImageStreamTag') {
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
 * fetches the IST, and inspects `image.dockerImageMetadata.Config.Labels`.
 *
 * Returns `{ isNonScalable: false }` silently on any error (missing IST, permissions, etc.).
 */
export const useNonScalableImageCheck = (
  resource: K8sResourceKind,
): { isNonScalable: boolean; loading: boolean } => {
  const [isNonScalable, setIsNonScalable] = useState(false);
  const [loading, setLoading] = useState(true);

  const istRef = useMemo(() => getISTReference(resource), [resource]);

  useEffect(() => {
    if (!istRef) {
      setIsNonScalable(false);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    k8sGet(ImageStreamTagModel, istRef.name, istRef.namespace)
      .then((ist: K8sResourceKind) => {
        if (!cancelled) {
          const labels = _.get(ist, 'image.dockerImageMetadata.Config.Labels', {});
          const nonScalableValue = labels[NON_SCALABLE_LABEL];
          setIsNonScalable(nonScalableValue === true || nonScalableValue === 'true');
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsNonScalable(false);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [istRef]);

  return { isNonScalable, loading };
};
