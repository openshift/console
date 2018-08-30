/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';

import { ResourceLink } from '../../../utils';
import { StatusCapability, CapabilityProps, DescriptorProps } from '../types';
import { Phase } from './phase';
import { PodStatusChart } from './pods';

// TODO(alecmerdler): Move these to separate module?
const Default: React.SFC<StatusCapabilityProps> = ({value}) => _.isEmpty(value) && !_.isNumber(value)
  ? <span className="text-muted">None</span>
  : <span>{value}</span>;

const PodStatuses: React.SFC<StatusCapabilityProps> = (props) => <PodStatusChart fetcher={() => props.value} statusDescriptor={props.descriptor} />;

// FIXME(alecmerdler): Need to revisit this component to show a table of conditions
const Conditions: React.SFC<StatusCapabilityProps> = ({value}) => !_.isEmpty(value)
  ? <span>{value.reduce((latest, next) => new Date(latest.lastUpdateTime) < new Date(next.lastUpdateTime) ? latest : next).type}</span>
  : <span className="text-muted">None</span>;

const Link: React.SFC<StatusCapabilityProps> = ({value}) => <a href={value}>{value.replace(/https?:\/\//, '')}</a>;

const K8sPhase: React.SFC<StatusCapabilityProps> = ({value}) => <Phase status={value} />;

const K8sPhaseReason: React.SFC<StatusCapabilityProps> = ({value}) => <pre>{value}</pre>;

const K8sResourceLink: React.SFC<StatusCapabilityProps> = (props) => <ResourceLink kind={props.capability.substr(StatusCapability.k8sResourcePrefix.length)} name={props.value} namespace={props.namespace} title={props.value} />;

const capabilityComponents = ImmutableMap<StatusCapability, React.ComponentType<StatusCapabilityProps>>()
  .set(StatusCapability.podStatuses, PodStatuses)
  .set(StatusCapability.conditions, Conditions)
  .set(StatusCapability.w3Link, Link)
  .set(StatusCapability.k8sPhase, K8sPhase)
  .set(StatusCapability.k8sPhaseReason, K8sPhaseReason)
  .set(StatusCapability.k8sResourcePrefix, K8sResourceLink);

const capabilityFor = (statusCapability: StatusCapability) => {
  if (_.isEmpty(statusCapability)) {
    return Default;
  } else if (statusCapability.startsWith(StatusCapability.k8sResourcePrefix)) {
    return capabilityComponents.get(StatusCapability.k8sResourcePrefix);
  }
  return capabilityComponents.get(statusCapability, Default);
};

/**
 * Main entrypoint component for rendering custom UI for a given status descriptor. This should be used instead of importing
 * individual components from this module.
 */
export const StatusDescriptor: React.SFC<DescriptorProps> = (props) => {
  const {descriptor, value, namespace} = props;
  // Only using first capability instead of dealing with combimations/permutations
  const capability = _.get(descriptor, ['x-descriptors', 0], null) as StatusCapability;
  const Capability = capabilityFor(capability);

  return <dl>
    <dt>{descriptor.displayName}</dt>
    <dd><Capability descriptor={descriptor} capability={capability} value={value} namespace={namespace} /></dd>
  </dl>;
};

type StatusCapabilityProps = CapabilityProps<StatusCapability>;

StatusDescriptor.displayName = 'StatusDescriptor';
Phase.displayName = 'Phase';
