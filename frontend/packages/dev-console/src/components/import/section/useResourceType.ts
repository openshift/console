import * as React from 'react';
import { FLAG_KNATIVE_SERVING_SERVICE } from '@console/knative-plugin';
import { useUserSettings, useFlag } from '@console/shared';
import {
  LAST_RESOURCE_TYPE_STORAGE_KEY,
  PREFERRED_RESOURCE_TYPE_USER_SETTING_KEY,
} from '../../../const';
import { Resources } from '../import-types';

const LAST_USED_RESOURCE_KEY = 'latest';

export const useResourceType = (): [string, React.Dispatch<React.SetStateAction<string>>] => {
  const isKnSvcEnabled = useFlag(FLAG_KNATIVE_SERVING_SERVICE);
  const defaultResourceType = isKnSvcEnabled ? Resources.KnativeService : Resources.Kubernetes;

  const [
    preferredResourceType,
    setPreferredResourceType,
    preferredResourceTypeLoaded,
  ] = useUserSettings<string>(PREFERRED_RESOURCE_TYPE_USER_SETTING_KEY, defaultResourceType);

  const [resourceType, setResourceType, resourceTypeLoaded] = useUserSettings<string>(
    LAST_RESOURCE_TYPE_STORAGE_KEY,
    defaultResourceType,
  );

  React.useEffect(() => {
    if (!isKnSvcEnabled) {
      if (
        preferredResourceTypeLoaded &&
        resourceTypeLoaded &&
        preferredResourceType === LAST_USED_RESOURCE_KEY &&
        resourceType === Resources.KnativeService
      ) {
        setResourceType(Resources.Kubernetes);
      } else if (
        preferredResourceTypeLoaded &&
        preferredResourceType === Resources.KnativeService
      ) {
        setPreferredResourceType(Resources.Kubernetes);
        setResourceType(Resources.Kubernetes);
      }
    }
  }, [
    isKnSvcEnabled,
    preferredResourceType,
    preferredResourceTypeLoaded,
    resourceType,
    resourceTypeLoaded,
    setPreferredResourceType,
    setResourceType,
  ]);

  React.useEffect(() => {
    if (preferredResourceTypeLoaded && preferredResourceType !== LAST_USED_RESOURCE_KEY) {
      setResourceType(preferredResourceType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredResourceType, preferredResourceTypeLoaded]);

  return [resourceType, setResourceType];
};
