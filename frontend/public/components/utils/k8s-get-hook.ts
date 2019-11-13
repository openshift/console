import * as React from 'react';
import { k8sGet, K8sKind, K8sResourceCommon } from '../../module/k8s';

export const useK8sGet = <R extends K8sResourceCommon = K8sResourceCommon>(
  kind: K8sKind,
  name?: string,
  namespace?: string,
  opts?: { [k: string]: string },
): [R, boolean, any] => {
  const [data, setData] = React.useState<R>();
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState();

  React.useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(null);
        setLoaded(false);
        setData(null);
        const resource = await k8sGet(kind, name, namespace, opts);
        setData(resource);
      } catch (error) {
        setLoadError(error);
      } finally {
        setLoaded(true);
      }
    };
    fetch();
  }, [kind, name, namespace, opts]);

  return [data, loaded, loadError];
};
