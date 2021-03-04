import * as React from 'react';
import { WatchK8sResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';

export type BeforeUnloadWatchResContextType = {
  // Add resource to watch for, and callback to control listner.
  watchResource: (resource: WatchK8sResource, cb: (r: K8sResourceKind) => boolean) => void;
};

export default React.createContext<BeforeUnloadWatchResContextType>({} as any);
