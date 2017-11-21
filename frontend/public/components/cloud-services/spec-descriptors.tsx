/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash';

import { ALMSpecDescriptors, ClusterServiceVersionResourceKind } from './index';
import { K8sKind } from '../../module/k8s';
import { LoadingInline, ResourceIcon, Selector, ResourceLink } from '../utils';
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

export const EndpointRow: React.StatelessComponent<EndpointRowProps> = ({endpoint}) => {
  let detail = <span className="text-muted">--</span>;

  if (_.has(endpoint, 'scheme')) {
    detail = <span><span className="text-muted">scheme:</span>{endpoint.scheme}</span>;
  } else if (_.has(endpoint, 'honorLabels')) {
    detail = <span><span className="text-muted">honorLabels:</span>{endpoint.honorLabels}</span>;
  } else if (_.has(endpoint, 'targetPort')) {
    detail = <span><span className="text-muted">targetPort:</span>{endpoint.targetPort}</span>;
  }

  return <div>
    <div className="row co-ip-header">
      <div className="col-xs-6">Port</div>
      <div className="col-xs-2">Interval</div>
      <div className="col-xs-4"></div>
    </div>
    <div className="rows">
      <div className="co-ip-row">
        <div className="row">
          <div className="col-xs-6">
            <p><ResourceIcon kind="Service" />{endpoint.port || '--'}</p>
          </div>
          <div className="col-xs-2">
            <p>{endpoint.interval || '--'}</p>
          </div>
          <div className="col-xs-4">
            {detail}
          </div>
        </div>
      </div>
    </div>
  </div>;
};

export const EndpointList: React.StatelessComponent<EndpointListProps> = (props) => <div className="service-ips">
  { props.endpoints.map((e, i) => <EndpointRow endpoint={e} key={i} />) }
</div>;

export class SpecDescriptor extends React.Component<SpecDescriptorProps, SpecDescriptorState> {
  constructor(props) {
    super(props);
    this.state = {changing: false};
  }

  render() {
    const {kindObj, resource, specDescriptor, specValue, namespace} = this.props;
    const descriptors = specDescriptor['x-descriptors'] || [];
    const wasChanged = () => this.setState({changing: true, });
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
          return <div><span className="text-muted">Memory:</span> {_.get(specValue, 'memory', '-')}</div>;
        default:
          if (specCapability.startsWith(ALMSpecDescriptors.k8sResourcePrefix)) {
            return <ResourceLink kind={specCapability.substr(ALMSpecDescriptors.k8sResourcePrefix.length)} name={specValue} namespace={namespace} title={specValue} />;
          } else if (specCapability.startsWith(ALMSpecDescriptors.selector)) {
            return <Selector selector={specValue} kind={specCapability.split(ALMSpecDescriptors.selector)[1]} />;
          }
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

export type SpecDescriptorState = {
  changing: boolean;
};

export type SpecDescriptorProps = {
  kindObj: K8sKind;
  resource: ClusterServiceVersionResourceKind;
  specDescriptor: ClusterServiceVersionResourceSpecDescriptor;
  specValue?: any;
  namespace?: string;
};

export type EndpointRowProps = {
  endpoint: any;
};

export type EndpointListProps = {
  endpoints: any[];
};
