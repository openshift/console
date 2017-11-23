/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';

import { ALMSpecDescriptors, ClusterServiceVersionResourceKind } from './index';
import { K8sKind } from '../../module/k8s';
import { LoadingInline } from '../utils';
import { configureCountModal } from '../modals';

const configureSizeModal = (kindObj, resource, specDescriptor, specValue, wasChanged) => {
  return configureCountModal({
    resourceKind: kindObj,
    resource: resource,
    defaultValue: specValue || 0,
    title: `Modify ${specDescriptor.displayName}`,
    message: specDescriptor.description,
    path: `/spec/${specDescriptor.path}`,
    buttonText: `Update ${specDescriptor.displayName}`,
    invalidateState: (isInvalid) => {
      // NOTE: Necessary until https://github.com/kubernetes/kubernetes/pull/53345 fixes WebSocket loading of the custom resources.
      if (isInvalid) {
        wasChanged();
      }
    },
  });
};

export class ClusterServiceVersionResourceModifier extends React.Component<ClusterServiceVersionResourceModifierProps, ClusterServiceVersionResourceModifierState> {
  constructor(props) {
    super(props);
    this.state = {changing: false};
  }

  render() {
    const {kindObj, resource, specDescriptor, specValue} = this.props;
    const descriptors = specDescriptor['x-descriptors'] || [];
    const wasChanged = () => this.setState({changing: true, });
    const controlElm = descriptors.reduce((result, specCapability) => {
      switch (specCapability) {
        case ALMSpecDescriptors.podCount:
          return <a onClick={() => configureSizeModal(kindObj, resource, specDescriptor, specValue, wasChanged)} className="co-m-modal-link">{specValue} pods</a>;
        default:
          return <span>(Unsupported)</span>;
      }
    }, <span />);

    return <dl>
      <dt>{specDescriptor.displayName}</dt>
      <dd>{this.state.changing ? <LoadingInline /> : controlElm}</dd>
    </dl>;
  }
}

export type ClusterServiceVersionResourceSpecDescriptor = {
  path: string;
  displayName: string;
  description: string;
  'x-descriptors': string[];
  value?: any;
};

export type ClusterServiceVersionResourceModifierState = {
  changing: boolean;
};

export type ClusterServiceVersionResourceModifierProps = {
  kindObj: K8sKind;
  resource: ClusterServiceVersionResourceKind;
  specDescriptor: ClusterServiceVersionResourceSpecDescriptor;
  specValue?: any;
  namespace?: string;
};
