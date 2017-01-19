import React from 'react';

import {TectonicChannel} from '../channel-operators/tectonic-channel';
import {ContainerLinuxUpdates} from '../container-linux-update-operator/container-linux-updates';

export const ClusterUpdates = () => <div className="co-cluster-updates">
  <TectonicChannel />
  <ContainerLinuxUpdates />
</div>;
