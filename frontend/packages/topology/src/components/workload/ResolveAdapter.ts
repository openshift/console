import * as React from 'react';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';

type ResolveAdapterProps<D> = {
  resource: K8sResourceCommon;
  useAdapterHook: (resource: K8sResourceCommon) => D;
  onAdapterDataResolved: (data: D) => void;
};

const ResolveAdapter = <D extends {}>({
  resource,
  useAdapterHook,
  onAdapterDataResolved,
}: ResolveAdapterProps<D>) => {
  const data = useAdapterHook(resource);

  React.useEffect(() => {
    if (data) {
      onAdapterDataResolved(data);
    }
    // We do not want to run the effect every time onAdapterDataResolved changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return null;
};

export default ResolveAdapter;
