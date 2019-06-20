import * as React from 'react';
import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';

import { ResourceLink, StatusIconAndText } from '../../../utils';
import { StatusCapability, CapabilityProps, DescriptorProps } from '../types';
import { Phase } from './phase';
import { PodStatusChart } from './pods';
import { Tooltip } from '../../../utils/tooltip';
import { Conditions } from '../../../conditions';

const Invalid: React.SFC<StatusCapabilityProps> = (props) => <span className="text-muted">
  <i className="fa fa-exclamation-triangle text-warning" aria-hidden="true" />&nbsp;&nbsp;The field <code>status.{props.descriptor.path}</code> is invalid
</span>;

const Default: React.SFC<StatusCapabilityProps> = ({value}) => {
  if (_.isEmpty(value) && !_.isNumber(value)) {
    return <span className="text-muted">None</span>;
  } else if (_.isObject(value)) {
    return <div className="row">{_.map(value, (v, k) => <span key={k}>{k}: {v}</span>)}</div>;
  }
  return <span>{_.toString(value)}</span>;
};

const PodStatuses: React.SFC<StatusCapabilityProps> = (props) => {
  return (!_.isObject(props.value) || _.some(props.value, v => !_.isArray(v))) && <Invalid {...props} />
    || _.every(props.value, v => _.isArray(v) && v.length === 0) && <span className="text-muted">No members</span>
    || <PodStatusChart fetcher={() => props.value} statusDescriptor={props.descriptor} />;
};

const StatusConditions: React.SFC<StatusCapabilityProps> = (props) => {
  return !_.isArray(props.value) && <Invalid {...props} />
    || props.value.length === 0 && <span className="text-muted">No conditions present</span>
    || <Conditions conditions={props.value} />;
};

const Link: React.SFC<StatusCapabilityProps> = ({value}) => <a href={value}>{value.replace(/https?:\/\//, '')}</a>;

const K8sPhase: React.SFC<StatusCapabilityProps> = ({value}) => <Phase status={value} />;

const K8sPhaseReason: React.SFC<StatusCapabilityProps> = ({value}) => _.isEmpty(value)
  ? <span className="text-muted">None</span>
  : <pre style={{width: 'max-content'}}>{value}</pre>;

const K8sResourceLink: React.SFC<StatusCapabilityProps> = (props) => <ResourceLink kind={props.capability.substr(StatusCapability.k8sResourcePrefix.length)} name={props.value} namespace={props.namespace} title={props.value} />;

const capabilityComponents = ImmutableMap<StatusCapability, React.ComponentType<StatusCapabilityProps>>()
  .set(StatusCapability.podStatuses, PodStatuses)
  .set(StatusCapability.conditions, StatusConditions)
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

  return <dl className="olm-descriptor">
    <div style={{width: 'max-content'}}>
      <Tooltip content={descriptor.description}>
        <dt className="olm-descriptor__title">{descriptor.displayName}</dt>
      </Tooltip>
    </div>
    <dd className="olm-descriptor__value">
      {descriptor.displayName === 'Status' ?
        (<StatusIconAndText status={value} iconName={value === 'Running' ? 'ok' : undefined} />) :
        (<Capability descriptor={descriptor} capability={capability} value={value} namespace={namespace} />)
      }
    </dd>
  </dl>;
};

type StatusCapabilityProps = CapabilityProps<StatusCapability>;

StatusDescriptor.displayName = 'StatusDescriptor';
Phase.displayName = 'Phase';
