import { useEffect, useRef } from 'react';
import { K8sResourceKind, k8sGet } from '@console/internal/module/k8s';

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
    kind: K8sResourceKind,
    name: string,
    ns: string,
    opts: object = {},
  ): Promise<K8sResourceKind> => {
    return new Promise((resolve, reject) => {
      k8sGet(
        kind,
        name,
        ns,
        Object.assign({ signal: controller.current.signal as AbortSignal }, opts),
      )
        .then((data) => mounted.current && resolve(data))
        .catch((error) => mounted.current && reject(error));
    });
  };
};
