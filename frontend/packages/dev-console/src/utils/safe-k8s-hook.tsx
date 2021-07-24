import { useEffect, useRef } from 'react';
import { k8sGet, Options } from '@console/internal/module/k8s/resource';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s/types';

export const useSafeK8s = () => {
  const controller = useRef<AbortController>();
  const mounted = useRef(true);

  useEffect(() => {
    controller.current = new AbortController();
    return () => {
      mounted.current = false;
      controller.current.abort();
    };
  }, []);

  return (
    kind: K8sKind,
    name: string,
    ns: string,
    opts: Options = {},
  ): Promise<K8sResourceKind> => {
    return new Promise((resolve, reject) => {
      k8sGet(kind, name, ns, opts, { signal: controller.current.signal as AbortSignal })
        .then((data) => mounted.current && resolve(data))
        .catch((error) => mounted.current && reject(error));
    });
  };
};
