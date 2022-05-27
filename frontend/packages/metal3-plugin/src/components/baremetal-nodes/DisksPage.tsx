import * as React from 'react';
import {
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { PageComponentProps } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { getNodeMachineName, createBasicLookup } from '@console/shared';
import { BareMetalHostModel } from '../../models';
import { getHostMachineName } from '../../selectors';
import { BareMetalHostKind } from '../../types';
import BareMetalHostDisks from '../baremetal-hosts/BareMetalHostDisks';

const DisksPage: React.FC<PageComponentProps<NodeKind>> = ({ obj }) => {
  const [hosts, loaded, loadError] = useK8sWatchResource<BareMetalHostKind[]>({
    groupVersionKind: getGroupVersionKindForModel(BareMetalHostModel),
    namespaced: true,
    isList: true,
  });
  let host: BareMetalHostKind;
  if (loaded) {
    const hostsByMachineName = createBasicLookup(hosts, getHostMachineName);
    host = hostsByMachineName[getNodeMachineName(obj)];
  }
  return <BareMetalHostDisks obj={host} loadError={loadError} loaded={loaded} />;
};

export default DisksPage;
