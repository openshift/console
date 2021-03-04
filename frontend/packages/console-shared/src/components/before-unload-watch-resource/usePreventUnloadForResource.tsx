import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { usePreventDataLossLock } from '@console/internal/components/utils/router-hooks';

export const usePreventUnloadForResource = () => {
  const [watchResourceData, setWatchResourceData] = React.useState({
    resource: null,
    callback: null,
  });
  const [lock, setLock] = React.useState<boolean>(false);
  const [resData, resLoaded, resError] = useK8sWatchResource<K8sResourceKind>(
    watchResourceData.resource,
  );
  usePreventDataLossLock(lock);

  React.useEffect(() => {
    resData &&
      resLoaded &&
      !resError &&
      watchResourceData.callback &&
      setLock(watchResourceData.callback(resData));
  }, [resData, resLoaded, resError, setLock, watchResourceData]);

  const watchResource = React.useCallback(
    (resource, callback) => setWatchResourceData({ resource, callback }),
    [setWatchResourceData],
  );

  return watchResource;
};
