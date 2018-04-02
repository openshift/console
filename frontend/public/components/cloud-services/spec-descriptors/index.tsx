/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { ALMSpecDescriptors, ClusterServiceVersionResourceKind } from '../index';
import { ResourceRequirementsModalLink } from './resource-requirements';
import { EndpointList } from './endpoint';
import { configureSizeModal } from './configure-size';
import { K8sKind } from '../../../module/k8s';
import { LoadingInline, Selector, ResourceLink } from '../../utils';

/**
 * Main entrypoint component for rendering custom UI for a given spec descriptor. This should be used instead of importing
 * individual components from this module.
 */
export class ClusterServiceVersionResourceSpec extends React.Component<SpecDescriptorProps, SpecDescriptorState> {
  constructor(props) {
    super(props);
    this.state = {changing: false};
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.changing && !_.isEqual(nextProps.specValue, this.props.specValue)) {
      this.setState({changing: false});
    }
  }

  render() {
    const {kindObj, resource, specDescriptor, specValue, namespace} = this.props;
    const descriptors = specDescriptor['x-descriptors'] || [];
    const wasChanged = () => Promise.resolve(this.setState({changing: true}));

    const controlElm = descriptors.reduce((result, specCapability) => {
      switch (specCapability) {
        case ALMSpecDescriptors.podCount:
          return <a onClick={() => configureSizeModal(kindObj, resource, specDescriptor, specValue, wasChanged)} className="co-m-modal-link">{specValue} pods</a>;
        case ALMSpecDescriptors.endpointList:
          return <EndpointList endpoints={specValue} />;
        case ALMSpecDescriptors.label:
          return <span>{specValue || '--'}</span>;
        case ALMSpecDescriptors.namespaceSelector:
          return <ResourceLink kind="Namespace" name={specValue.matchNames[0]} title={specValue.matchNames[0]} namespace={namespace} />;
        case ALMSpecDescriptors.resourceRequirements:
          return <dl className="co-spec-descriptor--resource-requirements">
            <dt>Resource Limits</dt>
            <dd><ResourceRequirementsModalLink type="limits" obj={resource} path={specDescriptor.path} onChange={wasChanged} /></dd>
            <dt>Request Limits</dt>
            <dd><ResourceRequirementsModalLink type="requests" obj={resource} path={specDescriptor.path} onChange={wasChanged} /></dd>
          </dl>;
        default:
          if (specCapability.startsWith(ALMSpecDescriptors.k8sResourcePrefix)) {
            return <ResourceLink kind={specCapability.substr(ALMSpecDescriptors.k8sResourcePrefix.length)} name={specValue} namespace={namespace} title={specValue} />;
          } else if (specCapability.startsWith(ALMSpecDescriptors.selector)) {
            return <Selector selector={specValue} kind={specCapability.split(ALMSpecDescriptors.selector)[1]} />;
          }
          return <span>(Unsupported)</span>;
      }
    }, <span />);

    return <dl className="co-m-pane__details">
      <dt>{specDescriptor.displayName}</dt>
      <dd>{this.state.changing ? <LoadingInline /> : controlElm}</dd>
    </dl>;
  }
}

export type SpecDescriptor = {
  path: string;
  displayName: string;
  description: string;
  'x-descriptors': string[];
  value?: any;
};

export type SpecDescriptorState = {
  changing: boolean;
};

export type SpecDescriptorProps = {
  kindObj: K8sKind;
  resource: ClusterServiceVersionResourceKind;
  specDescriptor: SpecDescriptor;
  specValue?: any;
  namespace?: string;
};
