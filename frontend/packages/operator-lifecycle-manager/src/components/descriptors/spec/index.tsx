import type { FC } from 'react';
import { useState, useMemo } from 'react';
import {
  Button,
  Switch,
  Checkbox,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
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
import { DASH } from '@console/shared/src/constants/ui';
import { DefaultCapability, K8sResourceLinkCapability, SecretCapability } from '../common';
import { CapabilityProps, SpecCapability, Error } from '../types';
import { getPatchPathFromDescriptor, getValidCapabilitiesForValue } from '../utils';
import { useConfigureSizeModal } from './configure-size';
import { configureUpdateStrategyModal } from './configure-update-strategy';
import { EndpointList, EndpointListProps } from './endpoint';
import { ResourceRequirementsModalLink } from './resource-requirements';

import './index.scss';

const PodCount: FC<SpecCapabilityProps<number>> = ({
  description,
  descriptor,
  label,
  model,
  obj,
  fullPath,
  value,
}) => {
  const launchConfigureSizeModal = useConfigureSizeModal({
    kindObj: model,
    resource: obj,
    specDescriptor: descriptor,
    specValue: value,
  });

  return (
    <DetailsItem
      description={description}
      label={label}
      obj={obj}
      path={fullPath}
      onEdit={launchConfigureSizeModal}
    >
      {_.isNil(value) ? '-' : `${value} pods`}
    </DetailsItem>
  );
};

const Endpoints: FC<SpecCapabilityProps<EndpointListProps['endpoints']>> = ({
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

const Label: FC<SpecCapabilityProps<LabelListProps['labels']>> = ({
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
      <span>{typeof value === 'string' ? value || DASH : DASH}</span>
    )}
  </DetailsItem>
);

const NamespaceSelector: FC<SpecCapabilityProps<{ matchNames: string[] }>> = ({
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
        <span className="pf-v6-u-text-color-subtle">{t('public~None')}</span>
      )}
    </DetailsItem>
  );
};

const ResourceRequirements: FC<SpecCapabilityProps> = ({
  description,
  descriptor,
  label,
  obj,
  fullPath,
}) => {
  const { t } = useTranslation();
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      <DescriptionList className="co-spec-descriptor--resource-requirements">
        <DescriptionListGroup>
          <DescriptionListTerm>{t('olm~Resource limits')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceRequirementsModalLink type="limits" obj={obj} path={descriptor.path} />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('olm~Resource requests')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceRequirementsModalLink type="requests" obj={obj} path={descriptor.path} />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </DetailsItem>
  );
};

const BasicSelector: FC<SpecCapabilityProps<SelectorType>> = ({
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

const BooleanSwitch: FC<SpecCapabilityProps<boolean>> = ({
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
  const [checked, setChecked] = useState(Boolean(value));
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
          onChange={(_event, val) => {
            setChecked(val);
            setConfirmed(false);
            setErrorMessage(null);
          }}
          label={t('public~True')}
        />
        &nbsp;&nbsp;
        {checked !== Boolean(value) && confirmed && <LoadingInline />}
        {checked !== Boolean(value) && !confirmed && (
          <>
            &nbsp;&nbsp;
            <Button className="pf-m-link--align-left" type="button" variant="link" onClick={update}>
              <YellowExclamationTriangleIcon className="co-icon-space-r" />
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

const CheckboxUIComponent: FC<SpecCapabilityProps<boolean>> = ({
  description,
  descriptor,
  label,
  model,
  obj,
  fullPath,
  value,
}) => {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(Boolean(value));
  const [confirmed, setConfirmed] = useState(false);

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
          onChange={(_event, val) => {
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
              <YellowExclamationTriangleIcon className="co-icon-space-r" />
              {t('olm~Confirm change')}
            </Button>
          </>
        )}
      </div>
    </DetailsItem>
  );
};

// TODO [tech debt] Create a type definition for udpate strategy api and use it here
const UpdateStrategy: FC<SpecCapabilityProps> = ({
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

export const SpecDescriptorDetailsItem: FC<SpecCapabilityProps> = ({ className, ...props }) => {
  const [capability] =
    getValidCapabilitiesForValue<SpecCapability>(props.descriptor, props.value) ?? [];

  const Component = useMemo(() => {
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
