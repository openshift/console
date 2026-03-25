import type { FC } from 'react';
import { useMemo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { DetailsItem } from '@console/internal/components/utils';
import { Status, SuccessStatus } from '@console/shared';
import { DefaultCapability, Invalid, K8sResourceLinkCapability, SecretCapability } from '../common';
import type { CapabilityProps } from '../types';
import { StatusCapability } from '../types';
import { isMainStatusDescriptor, getValidCapabilitiesForValue } from '../utils';
import { Phase } from './phase';
import type { PodStatusChartProps } from './pods';
import { PodStatusChart } from './pods';

const PodStatuses: FC<StatusCapabilityProps<PodStatusChartProps['statuses']>> = ({
  description,
  descriptor,
  fullPath,
  label,
  obj,
  value,
}) => {
  const { t } = useTranslation();
  const detail = useMemo(() => {
    if (!_.isObject(value) || _.some(value, (v) => !_.isArray(v))) {
      return <Invalid path={descriptor.path} />;
    }
    if (_.every(value, (v) => _.isArray(v) && v.length === 0)) {
      return <span className="pf-v6-u-text-color-subtle">{t('olm~No members')}</span>;
    }
    return <PodStatusChart statuses={value} subTitle={descriptor.path} />;
  }, [descriptor.path, t, value]);
  return (
    <DetailsItem
      description={description}
      label={label}
      obj={obj}
      path={fullPath}
      data-test="operand-details__section--info"
    >
      {detail}
    </DetailsItem>
  );
};

const Link: FC<StatusCapabilityProps<string>> = ({ description, fullPath, label, obj, value }) => {
  const { t } = useTranslation();
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {!_.isNil(value) ? (
        <a href={value}>{value.replace(/https?:\/\//, '')}</a>
      ) : (
        <span className="pf-v6-u-text-color-subtle">{t('public~None')}</span>
      )}
    </DetailsItem>
  );
};

const K8sPhase: FC<StatusCapabilityProps<string>> = ({
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

const K8sPhaseReason: FC<StatusCapabilityProps<string>> = ({
  description,
  fullPath,
  label,
  obj,
  value,
}) => {
  const { t } = useTranslation();
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {_.isEmpty(value) ? (
        <span className="pf-v6-u-text-color-subtle">{t('public~None')}</span>
      ) : (
        <pre className="co-pre" style={{ width: 'max-content' }}>
          {value}
        </pre>
      )}
    </DetailsItem>
  );
};

const MainStatus: FC<StatusCapabilityProps<string>> = ({
  description,
  fullPath,
  label,
  obj,
  value,
}) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    {value === 'Running' ? <SuccessStatus title={value} /> : <Status status={value} />}
  </DetailsItem>
);

export const StatusDescriptorDetailsItem: FC<StatusCapabilityProps> = ({ className, ...props }) => {
  const [capability] =
    getValidCapabilitiesForValue<StatusCapability>(props.descriptor, props.value) ?? [];

  const Component = useMemo(() => {
    if (capability?.startsWith(StatusCapability.k8sResourcePrefix)) {
      return K8sResourceLinkCapability;
    }

    switch (capability) {
      case StatusCapability.podStatuses:
        return PodStatuses;
      case StatusCapability.w3Link:
        return Link;
      case StatusCapability.k8sPhase:
        return K8sPhase;
      case StatusCapability.k8sPhaseReason:
        return K8sPhaseReason;
      case StatusCapability.password:
        return SecretCapability;
      case StatusCapability.hidden:
        return null;
      default:
        if (_.isObject(props.value)) {
          // eslint-disable-next-line no-console
          console.warn(
            `[Invalid StatusDescriptor] Cannot render a descriptor detail item for 'status.${props.descriptor.path}'. A valid x-descriptor must be provided for non-primitive properties.`,
            'See https://github.com/openshift/console/blob/master/frontend/packages/operator-lifecycle-manager/src/components/descriptors/reference/reference.md#olm-descriptor-reference',
          );
          return null;
        }
        return isMainStatusDescriptor(props.descriptor) ? MainStatus : DefaultCapability;
    }
  }, [capability, props.value, props.descriptor]);
  return Component ? (
    <div className={className}>
      <Component {...props} capability={capability} />
    </div>
  ) : null;
};

type StatusCapabilityProps<V = any> = CapabilityProps<StatusCapability, V>;

Phase.displayName = 'Phase';
PodStatuses.displayName = 'PodStatuses';
Link.displayName = 'Link';
K8sPhase.displayName = 'K8sPhase';
K8sPhaseReason.displayName = 'K8sPhaseReason';
MainStatus.displayName = 'MainStatus';
StatusDescriptorDetailsItem.displayName = 'StatusDescriptorDetailsItem';
