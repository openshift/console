import * as React from 'react';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import {
  Status,
  SuccessStatus,
  YellowExclamationTriangleIcon,
  getSchemaAtPath,
} from '@console/shared';
import { ResourceLink, DetailsItem } from '@console/internal/components/utils';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { Conditions } from '@console/internal/components/conditions';
import {
  CapabilityProps,
  DescriptorProps,
  StatusCapability,
  StatusDescriptor as StatusDescriptorType,
} from '../types';
import { Phase } from './phase';
import { PodStatusChart } from './pods';

const Invalid: React.SFC<{ path: string }> = ({ path }) => (
  <span className="text-muted">
    <YellowExclamationTriangleIcon />
    &nbsp;&nbsp;The field <code>status.{path}</code> is invalid
  </span>
);

const Default: React.SFC<StatusCapabilityProps> = ({
  description,
  fullPath,
  label,
  obj,
  value,
}) => {
  const detail = React.useMemo(() => {
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
    return _.toString(value);
  }, [value]);
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {detail}
    </DetailsItem>
  );
};

const PodStatuses: React.SFC<StatusCapabilityProps> = ({
  description,
  descriptor,
  fullPath,
  label,
  obj,
  value,
}) => {
  const detail = React.useMemo(() => {
    if (!_.isObject(value) || _.some(value, (v) => !_.isArray(v))) {
      return <Invalid path={descriptor.path} />;
    }
    if (_.every(value, (v) => _.isArray(v) && v.length === 0)) {
      return <span className="text-muted">No members</span>;
    }
    return <PodStatusChart statuses={value} subTitle={descriptor.path} />;
  }, [descriptor.path, value]);
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {detail}
    </DetailsItem>
  );
};

const StatusConditions: React.SFC<StatusCapabilityProps> = ({
  description,
  descriptor,
  fullPath,
  label,
  obj,
  value,
}) => {
  const detail = React.useMemo(() => {
    return (
      (!_.isArray(value) && <Invalid path={descriptor.path} />) ||
      (value.length === 0 && <span className="text-muted">No conditions present</span>) || (
        <Conditions conditions={value} />
      )
    );
  }, [descriptor.path, value]);
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {detail}
    </DetailsItem>
  );
};

const Link: React.SFC<StatusCapabilityProps> = ({ description, fullPath, label, obj, value }) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    {!_.isNil(value) ? (
      <a href={value}>{value.replace(/https?:\/\//, '')}</a>
    ) : (
      <span className="text-muted">None</span>
    )}
  </DetailsItem>
);

const K8sPhase: React.SFC<StatusCapabilityProps> = ({
  description,
  fullPath,
  label,
  obj,
  value,
}) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    <Phase status={value} />
  </DetailsItem>
);

const K8sPhaseReason: React.SFC<StatusCapabilityProps> = ({
  description,
  fullPath,
  label,
  obj,
  value,
}) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    {_.isEmpty(value) ? (
      <span className="text-muted">None</span>
    ) : (
      <pre style={{ width: 'max-content' }}>{value}</pre>
    )}
  </DetailsItem>
);

const K8sResourceLink: React.SFC<StatusCapabilityProps> = ({
  capability,
  description,
  fullPath,
  label,
  obj,
  value,
}) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    {_.isEmpty(value) ? (
      <span className="text-muted">None</span>
    ) : (
      <ResourceLink
        kind={capability.substr(StatusCapability.k8sResourcePrefix.length)}
        name={value}
        namespace={obj.metadata.namespace}
        title={value}
      />
    )}
  </DetailsItem>
);

const MainStatus: React.SFC<StatusCapabilityProps> = ({
  description,
  fullPath,
  label,
  obj,
  value,
}) => {
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {value === 'Running' ? <SuccessStatus title={value} /> : <Status status={value} />}
    </DetailsItem>
  );
};

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

const capabilityFor = (statusCapability: StatusCapability, descriptor: StatusDescriptorType) => {
  if (descriptor.displayName === 'Status') {
    return MainStatus;
  }
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
export const StatusDescriptor = withFallback(({ descriptor, obj, schema }: DescriptorProps) => {
  // Only using first capability instead of dealing with combimations/permutations
  const statusCapability = _.get(descriptor, ['x-descriptors', 0], null) as StatusCapability;
  const CapabilityComponent = capabilityFor(statusCapability, descriptor);
  const fullPath = ['status', ..._.toPath(descriptor.path)];
  const value = _.get(obj.status, _.toPath(descriptor.path), descriptor.value);
  const propertySchema = getSchemaAtPath(schema, descriptor.path);
  const description = descriptor?.description || propertySchema?.description;
  const label = descriptor?.displayName || propertySchema?.title;
  return CapabilityComponent ? (
    <dl className="olm-descriptor">
      <CapabilityComponent
        capability={statusCapability}
        description={description}
        descriptor={descriptor}
        fullPath={fullPath}
        label={label}
        obj={obj}
        value={value}
      />
    </dl>
  ) : null;
});

type StatusCapabilityProps = CapabilityProps<StatusCapability>;

StatusDescriptor.displayName = 'StatusDescriptor';
Phase.displayName = 'Phase';
Invalid.displayName = 'Invalid';
Default.displayName = 'Default';
PodStatuses.displayName = 'PodStatuses';
StatusConditions.displayName = 'StatusConditions';
Link.displayName = 'Link';
K8sPhase.displayName = 'K8sPhase';
K8sPhaseReason.displayName = 'K8sPhaseReason';
K8sResourceLink.displayName = 'K8sResourceLink';
MainStatus.displayName = 'MainStatus';
