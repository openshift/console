import * as React from 'react';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { Tooltip } from '@patternfly/react-core';
import { Status, SuccessStatus, YellowExclamationTriangleIcon } from '@console/shared';
import { ResourceLink } from '@console/internal/components/utils';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { Conditions } from '@console/internal/components/conditions';
import { StatusCapability, CapabilityProps, DescriptorProps } from '../types';
import { Phase } from './phase';
import { PodStatusChart } from './pods';

const Invalid: React.SFC<StatusCapabilityProps> = (props) => (
  <span className="text-muted">
    <YellowExclamationTriangleIcon />
    &nbsp;&nbsp;The field <code>status.{props.descriptor.path}</code> is invalid
  </span>
);

const Default: React.SFC<StatusCapabilityProps> = ({ value }) => {
  if (_.isEmpty(value) && !_.isNumber(value) && !_.isBoolean(value)) {
    return <span className="text-muted">None</span>;
  }
  if (_.isObject(value)) {
    return (
      <div className="row">
        {_.map(value, (v, k) => (
          <span key={k}>
            {k}: {v}
          </span>
        ))}
      </div>
    );
  }
  return <span>{_.toString(value)}</span>;
};

const PodStatuses: React.SFC<StatusCapabilityProps> = (props) => {
  return (
    ((!_.isObject(props.value) || _.some(props.value, (v) => !_.isArray(v))) && (
      <Invalid {...props} />
    )) ||
    (_.every(props.value, (v) => _.isArray(v) && v.length === 0) && (
      <span className="text-muted">No members</span>
    )) || <PodStatusChart statuses={props.value} statusDescriptor={props.descriptor} />
  );
};

const StatusConditions: React.SFC<StatusCapabilityProps> = (props) => {
  return (
    (!_.isArray(props.value) && <Invalid {...props} />) ||
    (props.value.length === 0 && <span className="text-muted">No conditions present</span>) || (
      <Conditions conditions={props.value} />
    )
  );
};

const Link: React.SFC<StatusCapabilityProps> = ({ value }) =>
  !_.isNil(value) ? (
    <a href={value}>{value.replace(/https?:\/\//, '')}</a>
  ) : (
    <span className="text-muted">None</span>
  );

const K8sPhase: React.SFC<StatusCapabilityProps> = ({ value }) => <Phase status={value} />;

const K8sPhaseReason: React.SFC<StatusCapabilityProps> = ({ value }) =>
  _.isEmpty(value) ? (
    <span className="text-muted">None</span>
  ) : (
    <pre style={{ width: 'max-content' }}>{value}</pre>
  );

const K8sResourceLink: React.SFC<StatusCapabilityProps> = (props) => (
  <ResourceLink
    kind={props.capability.substr(StatusCapability.k8sResourcePrefix.length)}
    name={props.value}
    namespace={props.namespace}
    title={props.value}
  />
);

const capabilityComponents = ImmutableMap<
  StatusCapability,
  React.ComponentType<StatusCapabilityProps>
>()
  .set(StatusCapability.podStatuses, PodStatuses)
  .set(StatusCapability.conditions, StatusConditions)
  .set(StatusCapability.w3Link, Link)
  .set(StatusCapability.k8sPhase, K8sPhase)
  .set(StatusCapability.k8sPhaseReason, K8sPhaseReason)
  .set(StatusCapability.k8sResourcePrefix, K8sResourceLink)
  .set(StatusCapability.hidden, null);

const capabilityFor = (statusCapability: StatusCapability) => {
  if (_.isEmpty(statusCapability)) {
    return Default;
  }
  if (statusCapability.startsWith(StatusCapability.k8sResourcePrefix)) {
    return capabilityComponents.get(StatusCapability.k8sResourcePrefix);
  }
  return capabilityComponents.get(statusCapability, Default);
};

/**
 * Main entrypoint component for rendering custom UI for a given status descriptor. This should be used instead of importing
 * individual components from this module.
 */
export const StatusDescriptor = withFallback((props: DescriptorProps) => {
  const { descriptor, value, namespace } = props;
  // Only using first capability instead of dealing with combimations/permutations
  const capability = _.get(descriptor, ['x-descriptors', 0], null) as StatusCapability;
  const Capability = capabilityFor(capability);

  return Capability ? (
    <dl className="olm-descriptor">
      <Tooltip content={descriptor.description}>
        <dt className="olm-descriptor__title" data-test-descriptor-label={descriptor.displayName}>
          {descriptor.displayName}
        </dt>
      </Tooltip>
      <dd className="olm-descriptor__value">
        {descriptor.displayName === 'Status' ? (
          value === 'Running' ? (
            <SuccessStatus title={value} />
          ) : (
            <Status status={value} />
          )
        ) : (
          <Capability
            descriptor={descriptor}
            capability={capability}
            value={value}
            namespace={namespace}
          />
        )}
      </dd>
    </dl>
  ) : null;
});

type StatusCapabilityProps = CapabilityProps<StatusCapability>;

StatusDescriptor.displayName = 'StatusDescriptor';
Phase.displayName = 'Phase';
