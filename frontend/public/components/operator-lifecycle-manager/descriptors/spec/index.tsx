/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';

import { SpecCapability, DescriptorProps, CapabilityProps } from '../types';
import { ResourceRequirementsModalLink } from './resource-requirements';
import { EndpointList } from './endpoint';
import { configureSizeModal } from './configure-size';
import { Selector, ResourceLink } from '../../../utils';

const Default: React.SFC<SpecCapabilityProps> = ({value}) => _.isEmpty(value) && !_.isNumber(value)
  ? <span className="text-muted">None</span>
  : <span>{value}</span>;

const PodCount: React.SFC<SpecCapabilityProps> = ({model, obj, descriptor, value}) =>
  <a onClick={() => configureSizeModal({kindObj: model, resource: obj, specDescriptor: descriptor, specValue: value})} className="co-m-modal-link">{value} pods</a>;

const Endpoints: React.SFC<SpecCapabilityProps> = ({value}) => <EndpointList endpoints={value} />;

const Label: React.SFC<SpecCapabilityProps> = ({value}) => <span>{value || '--'}</span>;

const NamespaceSelector: React.SFC<SpecCapabilityProps> = ({value}) => <ResourceLink kind="Namespace" name={value.matchNames[0]} title={value.matchNames[0]} />;

const ResourceRequirements: React.SFC<SpecCapabilityProps> = ({obj, descriptor}) => <dl className="co-spec-descriptor--resource-requirements">
  <dt>Resource Limits</dt>
  <dd><ResourceRequirementsModalLink type="limits" obj={obj} path={descriptor.path} /></dd>
  <dt>Request Limits</dt>
  <dd><ResourceRequirementsModalLink type="requests" obj={obj} path={descriptor.path} /></dd>
</dl>;

const K8sResourceLink: React.SFC<SpecCapabilityProps> = (props) => <ResourceLink kind={props.capability.split(SpecCapability.k8sResourcePrefix)[1]} name={props.value} namespace={props.namespace} title={props.value} />;

const BasicSelector: React.SFC<SpecCapabilityProps> = ({value, capability}) => <Selector selector={value} kind={capability.split(SpecCapability.selector)[1]} />;

const capabilityComponents = ImmutableMap<SpecCapability, React.ComponentType<SpecCapabilityProps>>()
  .set(SpecCapability.podCount, PodCount)
  .set(SpecCapability.endpointList, Endpoints)
  .set(SpecCapability.label, Label)
  .set(SpecCapability.namespaceSelector, NamespaceSelector)
  .set(SpecCapability.resourceRequirements, ResourceRequirements)
  .set(SpecCapability.k8sResourcePrefix, K8sResourceLink)
  .set(SpecCapability.selector, BasicSelector);

const capabilityFor = (specCapability: SpecCapability) => {
  if (_.isEmpty(specCapability)) {
    return Default;
  } else if (specCapability.startsWith(SpecCapability.k8sResourcePrefix)) {
    return capabilityComponents.get(SpecCapability.k8sResourcePrefix);
  } else if (specCapability.startsWith(SpecCapability.selector)) {
    return capabilityComponents.get(SpecCapability.selector);
  }
  return capabilityComponents.get(specCapability, Default);
};

/**
 * Main entrypoint component for rendering custom UI for a given spec descriptor. This should be used instead of importing
 * individual components from this module.
 */
export const SpecDescriptor: React.SFC<DescriptorProps> = (props) => {
  const {model, obj, descriptor, value, namespace} = props;
  // Only using first capability instead of dealing with combimations/permutations
  const capability = _.get(descriptor, ['x-descriptors', 0], null) as SpecCapability;
  const Capability = capabilityFor(capability);

  return <dl>
    <dt>{descriptor.displayName}</dt>
    <dd><Capability descriptor={descriptor} capability={capability} value={value} namespace={namespace} model={model} obj={obj} /></dd>
  </dl>;
};

type SpecCapabilityProps = CapabilityProps<SpecCapability>;
