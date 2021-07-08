import * as React from 'react';
import { PageComponentProps } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel, NodeKind } from '@console/internal/module/k8s';
import { getNodeMachineName, createBasicLookup } from '@console/shared';
import { BareMetalHostModel } from '../../models';
import { getHostMachineName } from '../../selectors';
import { BareMetalHostKind } from '../../types';
import BareMetalHostDisks from '../baremetal-hosts/BareMetalHostDisks';

const bareMetalHosts = {
  kind: referenceForModel(BareMetalHostModel),
  namespaced: true,
  isList: true,
};

const DisksPage: React.FC<PageComponentProps<NodeKind>> = ({ obj }) => {
  const [hosts, loaded, loadError] = useK8sWatchResource<BareMetalHostKind[]>(bareMetalHosts);
  let host: BareMetalHostKind;
  if (loaded) {
    const hostsByMachineName = createBasicLookup(hosts, getHostMachineName);
    host = hostsByMachineName[getNodeMachineName(obj)];
  }
  return <BareMetalHostDisks obj={host} loadError={loadError} />;
};

export default DisksPage;
