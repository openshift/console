import * as React from 'react';
import { Button, Switch, Checkbox } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  LoadingInline,
  ResourceLink,
  Selector,
  DetailsItem,
  LabelList,
  LabelListProps,
} from '@console/internal/components/utils';
import { k8sPatch, k8sUpdate, Selector as SelectorType } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { DefaultCapability, K8sResourceLinkCapability, SecretCapability } from '../common';
import { CapabilityProps, SpecCapability, Error } from '../types';
import { getPatchPathFromDescriptor, getValidCapabilitiesForValue } from '../utils';
import { configureSizeModal } from './configure-size';
import { configureUpdateStrategyModal } from './configure-update-strategy';
import { EndpointList, EndpointListProps } from './endpoint';
import { ResourceRequirementsModalLink } from './resource-requirements';

const PodCount: React.FC<SpecCapabilityProps<number>> = ({
  description,
  descriptor,
  label,
  model,
  obj,
  fullPath,
  value,
}) => (
  <DetailsItem
    description={description}
    label={label}
    obj={obj}
    path={fullPath}
    onEdit={() =>
      configureSizeModal({
        kindObj: model,
        resource: obj,
        specDescriptor: descriptor,
        specValue: value,
      })
    }
  >
    {_.isNil(value) ? '-' : `${value} pods`}
  </DetailsItem>
);

const Endpoints: React.FC<SpecCapabilityProps<EndpointListProps['endpoints']>> = ({
  description,
  label,
  obj,
  fullPath,
  value,
}) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    <EndpointList endpoints={value} />
  </DetailsItem>
);

const Label: React.FC<SpecCapabilityProps<LabelListProps['labels']>> = ({
  description,
  label,
  model,
  obj,
  fullPath,
  value,
}) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    {_.isObject(value) ? (
      <LabelList kind={model.kind} labels={value} />
    ) : (
      <span>{value || '-'}</span>
    )}
  </DetailsItem>
);

const NamespaceSelector: React.FC<SpecCapabilityProps<{ matchNames: string[] }>> = ({
  description,
  label,
  obj,
  fullPath,
  value,
}) => {
  const { t } = useTranslation();
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {value?.matchNames?.[0] ? (
        <ResourceLink kind="Namespace" name={value.matchNames[0]} title={value.matchNames[0]} />
      ) : (
        <span className="text-muted">{t('public~None')}</span>
      )}
    </DetailsItem>
  );
};

const ResourceRequirements: React.FC<SpecCapabilityProps> = ({
  description,
  descriptor,
  label,
  obj,
  fullPath,
}) => {
  const { t } = useTranslation();
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      <dl className="co-spec-descriptor--resource-requirements">
        <dt>{t('olm~Resource limits')}</dt>
        <dd>
          <ResourceRequirementsModalLink type="limits" obj={obj} path={descriptor.path} />
        </dd>
        <dt>{t('olm~Resource requests')}</dt>
        <dd>
          <ResourceRequirementsModalLink type="requests" obj={obj} path={descriptor.path} />
        </dd>
      </dl>
    </DetailsItem>
  );
};

const BasicSelector: React.FC<SpecCapabilityProps<SelectorType>> = ({
  capability,
  description,
  label,
  obj,
  fullPath,
  value,
}) => {
  const [, kind] = capability.split(SpecCapability.selector);
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      <Selector selector={value} kind={kind?.replace(/:/g, '~')} />
    </DetailsItem>
  );
};

const BooleanSwitch: React.FC<SpecCapabilityProps<boolean>> = ({
  model,
  obj,
  description,
  descriptor,
  label,
  onError,
  fullPath,
  value,
}) => {
  const { t } = useTranslation();
  const [checked, setChecked] = React.useState(Boolean(value));
  const [confirmed, setConfirmed] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState(null);

  const errorCb = (err: Error): void => {
    setConfirmed(false);
    setChecked(Boolean(value));
    setErrorMessage(err.message);
    onError(err);
  };

  const update = () => {
    setConfirmed(true);
    setErrorMessage(null);

    if (_.has(obj, `spec.${descriptor.path}`)) {
      const patchFor = (val: boolean) => [
        { op: 'add', path: `/spec/${getPatchPathFromDescriptor(descriptor)}`, value: val },
      ];
      return k8sPatch(model, obj, patchFor(checked)).catch((err) => errorCb(err));
    }

    const newObj = _.cloneDeep(obj);
    _.set(newObj, `spec.${descriptor.path}`, checked);
    return k8sUpdate(model, newObj).catch((err) => errorCb(err));
  };

  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      <div className="co-spec-descriptor--switch">
        <Switch
          id={descriptor.path}
          isChecked={checked}
          onChange={(val) => {
            setChecked(val);
            setConfirmed(false);
            setErrorMessage(null);
          }}
          label={t('public~True')}
          labelOff={t('public~False')}
        />
        &nbsp;&nbsp;
        {checked !== Boolean(value) && confirmed && <LoadingInline />}
        {checked !== Boolean(value) && !confirmed && (
          <>
            &nbsp;&nbsp;
            <Button className="pf-m-link--align-left" type="button" variant="link" onClick={update}>
              <YellowExclamationTriangleIcon className="co-icon-space-r pf-c-button-icon--plain" />
              {t('olm~Confirm change')}
            </Button>
          </>
        )}
      </div>
      {errorMessage && (
        <div className="cos-error-title co-break-word">
          {errorMessage || t('olm~An error occurred')}
        </div>
      )}
    </DetailsItem>
  );
};

const CheckboxUIComponent: React.FC<SpecCapabilityProps<boolean>> = ({
  description,
  descriptor,
  label,
  model,
  obj,
  fullPath,
  value,
}) => {
  const { t } = useTranslation();
  const [checked, setChecked] = React.useState(Boolean(value));
  const [confirmed, setConfirmed] = React.useState(false);

  const patchFor = (val: boolean) => [
    { op: 'add', path: `/spec/${getPatchPathFromDescriptor(descriptor)}`, value: val },
  ];
  const update = () => {
    setConfirmed(true);
    return k8sPatch(model, obj, patchFor(checked));
  };

  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      <div className="co-spec-descriptor--switch">
        <Checkbox
          id={descriptor.path}
          style={{ marginLeft: '10px' }}
          isChecked={checked}
          data-checked-state={checked}
          label={label}
          onChange={(val) => {
            setChecked(val);
            setConfirmed(false);
          }}
        />
        &nbsp;&nbsp;
        {checked !== Boolean(value) && confirmed && <LoadingInline />}
        {checked !== Boolean(value) && !confirmed && (
          <>
            &nbsp;&nbsp;
            <Button className="pf-m-link--align-left" type="button" variant="link" onClick={update}>
              <YellowExclamationTriangleIcon className="co-icon-space-r pf-c-button-icon--plain" />
              {t('olm~Confirm change')}
            </Button>
          </>
        )}
      </div>
    </DetailsItem>
  );
};

// TODO [tech debt] Create a type definition for udpate strategy api and use it here
const UpdateStrategy: React.FC<SpecCapabilityProps> = ({
  description,
  descriptor,
  label,
  model,
  obj,
  fullPath,
  value,
}) => {
  const { t } = useTranslation();
  return (
    <DetailsItem
      description={description}
      label={label}
      obj={obj}
      onEdit={() =>
        configureUpdateStrategyModal({
          kindObj: model,
          resource: obj,
          specDescriptor: descriptor,
          specValue: value,
        })
      }
      path={fullPath}
    >
      {value?.type ?? t('public~None')}
    </DetailsItem>
  );
};

export const SpecDescriptorDetailsItem: React.FC<SpecCapabilityProps> = ({
  className,
  ...props
}) => {
  const [capability] =
    getValidCapabilitiesForValue<SpecCapability>(props.descriptor, props.value) ?? [];

  const Component = React.useMemo(() => {
    if (capability?.startsWith(SpecCapability.k8sResourcePrefix)) {
      return K8sResourceLinkCapability;
    }

    if (capability?.startsWith(SpecCapability.selector)) {
      return BasicSelector;
    }

    switch (capability) {
      case SpecCapability.podCount:
        return PodCount;
      case SpecCapability.endpointList:
        return Endpoints;
      case SpecCapability.label:
        return Label;
      case SpecCapability.namespaceSelector:
        return NamespaceSelector;
      case SpecCapability.resourceRequirements:
        return ResourceRequirements;
      case SpecCapability.booleanSwitch:
        return BooleanSwitch;
      case SpecCapability.password:
        return SecretCapability;
      case SpecCapability.updateStrategy:
        return UpdateStrategy;
      case SpecCapability.checkbox:
        return CheckboxUIComponent;
      case SpecCapability.hidden:
        return null;
      default:
        if (_.isObject(props.value)) {
          // eslint-disable-next-line no-console
          console.warn(
            `[Invalid SpecDescriptor] Cannot render 'spec.${props.descriptor.path}'. A valid x-descriptor must be provided for non-primitive properties.`,
            'See https://github.com/openshift/console/blob/master/frontend/packages/operator-lifecycle-manager/src/components/descriptors/reference/reference.md#olm-descriptor-reference',
          );
          return null;
        }
        return DefaultCapability;
    }
  }, [props.descriptor, props.value, capability]);
  return Component ? (
    <div className={className}>
      <Component {...props} capability={capability} />
    </div>
  ) : null;
};

type SpecCapabilityProps<V = any> = CapabilityProps<SpecCapability, V>;
PodCount.displayName = 'PodCount';
Endpoints.displayName = 'Endpoints';
Label.displayName = 'Label';
NamespaceSelector.displayName = 'NamespaceSelector';
ResourceRequirements.displayName = 'ResourceRequirements';
BasicSelector.displayName = 'BasicSelector';
BooleanSwitch.displayName = 'BooleanSwitch';
CheckboxUIComponent.displayName = 'CheckboxUIComponent';
UpdateStrategy.displayName = 'UpdateStrategy';
SpecDescriptorDetailsItem.displayName = 'SpecDescriptorDetailsItem';
