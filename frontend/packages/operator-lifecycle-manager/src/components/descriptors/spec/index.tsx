import * as React from 'react';
import { Button, Switch, Checkbox } from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SecretValue } from '@console/internal/components/configmap-and-secret-data';
import {
  LoadingInline,
  ResourceLink,
  Selector,
  DetailsItem,
  LabelList,
} from '@console/internal/components/utils';
import { k8sPatch, k8sUpdate } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { DefaultCapability, K8sResourceLinkCapability } from '../common';
import { CapabilityProps, SpecCapability, Error } from '../types';
import { getPatchPathFromDescriptor, getValidCapabilitiesForValue } from '../utils';
import { configureSizeModal } from './configure-size';
import { configureUpdateStrategyModal } from './configure-update-strategy';
import { EndpointList } from './endpoint';
import { ResourceRequirementsModalLink } from './resource-requirements';

const PodCount: React.FC<SpecCapabilityProps> = ({
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
    {value} pods
  </DetailsItem>
);

const Endpoints: React.FC<SpecCapabilityProps> = ({ description, label, obj, fullPath, value }) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    <EndpointList endpoints={value} />
  </DetailsItem>
);

const Label: React.FC<SpecCapabilityProps> = ({
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
      <span>{value || '--'}</span>
    )}
  </DetailsItem>
);

const NamespaceSelector: React.FC<SpecCapabilityProps> = ({
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

const BasicSelector: React.FC<SpecCapabilityProps> = ({
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

const BooleanSwitch: React.FC<SpecCapabilityProps> = ({
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

const CheckboxUIComponent: React.FC<SpecCapabilityProps> = ({
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

const Secret: React.FC<SpecCapabilityProps> = ({ description, label, obj, fullPath, value }) => {
  const { t } = useTranslation();
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
              {t('olm~Hide values')}
            </>
          ) : (
            <>
              <EyeIcon className="co-icon-space-r" />
              {t('olm~Reveal values')}
            </>
          )}
        </Button>
        <SecretValue value={value} encoded={false} reveal={reveal} />
      </div>
    </DetailsItem>
  );
};

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

export const SpecDescriptorDetailsItem: React.FC<SpecCapabilityProps> = (props) => {
  const [capability] =
    getValidCapabilitiesForValue<SpecCapability>(props.descriptor, props.value, true) ?? [];

  if (capability?.startsWith(SpecCapability.k8sResourcePrefix)) {
    return <K8sResourceLinkCapability capability={capability} {...props} />;
  }

  if (capability?.startsWith(SpecCapability.selector)) {
    return <BasicSelector capability={capability} {...props} />;
  }

  switch (capability) {
    case SpecCapability.podCount:
      return <PodCount {...props} />;
    case SpecCapability.endpointList:
      return <Endpoints {...props} />;
    case SpecCapability.label:
      return <Label {...props} />;
    case SpecCapability.namespaceSelector:
      return <NamespaceSelector {...props} />;
    case SpecCapability.resourceRequirements:
      return <ResourceRequirements {...props} />;
    case SpecCapability.booleanSwitch:
      return <BooleanSwitch {...props} />;
    case SpecCapability.password:
      return <Secret {...props} />;
    case SpecCapability.updateStrategy:
      return <UpdateStrategy {...props} />;
    case SpecCapability.checkbox:
      return <CheckboxUIComponent {...props} />;
    case SpecCapability.hidden:
      return null;
    default:
      if (_.isObject(props.value)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[Invalid SpecDescriptor] Descriptor is incompatible with non-primitive value.`,
          props.descriptor,
        );
      }
      return <DefaultCapability {...props} />;
  }
};

type SpecCapabilityProps = CapabilityProps<SpecCapability>;
PodCount.displayName = 'PodCount';
Endpoints.displayName = 'Endpoints';
Label.displayName = 'Label';
NamespaceSelector.displayName = 'NamespaceSelector';
ResourceRequirements.displayName = 'ResourceRequirements';
BasicSelector.displayName = 'BasicSelector';
BooleanSwitch.displayName = 'BooleanSwitch';
CheckboxUIComponent.displayName = 'CheckboxUIComponent';
Secret.displayName = 'Secret';
UpdateStrategy.displayName = 'UpdateStrategy';
SpecDescriptorDetailsItem.displayName = 'SpecDescriptorDetailsItem';
