import { useEffect, useRef } from 'react';
import { K8sResourceKind, k8sGet, k8sList } from '@console/internal/module/k8s';
import { Pipeline } from './pipeline-augment';

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

  const safeK8sGet = (
    kind: K8sResourceKind,
    name: string,
    ns: string,
    opts: object = {},
  ): Promise<Pipeline> => {
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

  const safeK8sList = (
    kind: K8sResourceKind,
    params: Record<string, any> = {},
    raw: boolean = false,
    opts: object = {},
  ): Promise<Pipeline[]> => {
    return new Promise((resolve, reject) => {
      k8sList(
        kind,
        params,
        raw,
        Object.assign({ signal: controller.current.signal as AbortSignal }, opts),
      )
        .then((data) => mounted.current && resolve(data))
        .catch((error) => mounted.current && reject(error));
    });
  };

  return {
    k8sGet: safeK8sGet,
    k8sList: safeK8sList,
  };
};
