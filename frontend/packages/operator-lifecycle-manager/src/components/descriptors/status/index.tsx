import * as React from 'react';
import * as _ from 'lodash';
import { Button } from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import { Status, SuccessStatus, YellowExclamationTriangleIcon } from '@console/shared';
import { DetailsItem } from '@console/internal/components/utils';
import { Conditions } from '@console/internal/components/conditions';
import { SecretValue } from '@console/internal/components/configmap-and-secret-data';
import { CapabilityProps, StatusCapability } from '../types';
import { Phase } from './phase';
import { PodStatusChart } from './pods';
import { DefaultCapability, K8sResourceLinkCapability } from '../common';

const Invalid: React.FC<{ path: string }> = ({ path }) => (
  <span className="text-muted olm-descriptors__invalid-pod-descriptor">
    <YellowExclamationTriangleIcon />
    &nbsp;&nbsp;The field <code>status.{path}</code> is invalid
  </span>
);

const PodStatuses: React.FC<StatusCapabilityProps> = ({
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
    <div className="co-operand-details__section--info">
      <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
        {detail}
      </DetailsItem>
    </div>
  );
};

const StatusConditions: React.FC<StatusCapabilityProps> = ({
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

const Link: React.FC<StatusCapabilityProps> = ({ description, fullPath, label, obj, value }) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    {!_.isNil(value) ? (
      <a href={value}>{value.replace(/https?:\/\//, '')}</a>
    ) : (
      <span className="text-muted">None</span>
    )}
  </DetailsItem>
);

const K8sPhase: React.FC<StatusCapabilityProps> = ({
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

const K8sPhaseReason: React.FC<StatusCapabilityProps> = ({
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

const Secret: React.FC<StatusCapabilityProps> = ({ description, label, obj, fullPath, value }) => {
  const [reveal, setReveal] = React.useState(false);

  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      <div className="co-toggle-reveal-value">
        <Button
          type="button"
          variant="link"
          isInline
          className="pf-m-link--align-right co-toggle-reveal-value__btn"
          onClick={() => setReveal(!reveal)}
        >
          {reveal ? (
            <>
              <EyeSlashIcon className="co-icon-space-r" />
              Hide Values
            </>
          ) : (
            <>
              <EyeIcon className="co-icon-space-r" />
              Reveal Values
            </>
          )}
        </Button>
        <SecretValue value={value} encoded={false} reveal={reveal} />
      </div>
    </DetailsItem>
  );
};

const MainStatus: React.FC<StatusCapabilityProps> = ({
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

export const StatusDescriptorDetailsItem: React.FC<StatusCapabilityProps> = (props) => {
  const capability = _.get(props.descriptor, ['x-descriptors', 0], null) as StatusCapability;
  if (props.descriptor.path === 'status' || props.descriptor.displayName === 'Status') {
    return <MainStatus {...props} />;
  }

  if (_.isEmpty(capability)) {
    return <DefaultCapability {...props} />;
  }

  if (capability.startsWith(StatusCapability.k8sResourcePrefix)) {
    return <K8sResourceLinkCapability capability={capability} {...props} />;
  }

  switch (capability) {
    case StatusCapability.podStatuses:
      return <PodStatuses {...props} />;
    case StatusCapability.conditions:
      return <StatusConditions {...props} />;
    case StatusCapability.w3Link:
      return <Link {...props} />;
    case StatusCapability.k8sPhase:
      return <K8sPhase {...props} />;
    case StatusCapability.k8sPhaseReason:
      return <K8sPhaseReason {...props} />;
    case StatusCapability.password:
      return <Secret {...props} />;
    case StatusCapability.hidden:
      return null;
    default:
      return <DefaultCapability {...props} />;
  }
};

type StatusCapabilityProps = CapabilityProps<StatusCapability>;

Phase.displayName = 'Phase';
Invalid.displayName = 'Invalid';
PodStatuses.displayName = 'PodStatuses';
StatusConditions.displayName = 'StatusConditions';
Link.displayName = 'Link';
K8sPhase.displayName = 'K8sPhase';
K8sPhaseReason.displayName = 'K8sPhaseReason';
MainStatus.displayName = 'MainStatus';
StatusDescriptorDetailsItem.displayName = 'StatusDescriptorDetailsItem';
Secret.displayName = 'Secret';
