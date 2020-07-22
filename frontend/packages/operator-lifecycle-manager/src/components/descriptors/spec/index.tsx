import * as _ from 'lodash';
import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
import { Button, Switch, Checkbox } from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import {
  LoadingInline,
  ResourceLink,
  Selector,
  DetailsItem,
} from '@console/internal/components/utils';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { k8sPatch, k8sUpdate } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon, getSchemaAtPath } from '@console/shared';
import { SecretValue } from '@console/internal/components/configmap-and-secret-data';
import { CapabilityProps, DescriptorProps, SpecCapability, Error } from '../types';
import { ResourceRequirementsModalLink } from './resource-requirements';
import { EndpointList } from './endpoint';
import { configureSizeModal } from './configure-size';
import { configureUpdateStrategyModal } from './configure-update-strategy';
import { REGEXP_K8S_RESOURCE_SUFFIX } from '../const';

const Default: React.SFC<SpecCapabilityProps> = ({ description, label, obj, fullPath, value }) => {
  const detail = React.useMemo(() => {
    if (_.isEmpty(value) && !_.isFinite(value) && !_.isBoolean(value)) {
      return <span className="text-muted">None</span>;
    }
    if (_.isObject(value)) {
      return <span className="text-muted">Unsupported</span>;
    }
    return <span>{_.toString(value)}</span>;
  }, [value]);

  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {detail}
    </DetailsItem>
  );
};

const PodCount: React.SFC<SpecCapabilityProps> = ({
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

const Endpoints: React.SFC<SpecCapabilityProps> = ({
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

const Label: React.SFC<SpecCapabilityProps> = ({ description, label, obj, fullPath, value }) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    {value || '--'}
  </DetailsItem>
);

const NamespaceSelector: React.SFC<SpecCapabilityProps> = ({
  description,
  label,
  obj,
  fullPath,
  value,
}) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    {value?.matchNames?.[0] ? (
      <ResourceLink kind="Namespace" name={value.matchNames[0]} title={value.matchNames[0]} />
    ) : (
      <span className="text-muted">None</span>
    )}
  </DetailsItem>
);

const ResourceRequirements: React.SFC<SpecCapabilityProps> = ({
  description,
  descriptor,
  label,
  obj,
  fullPath,
}) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    <dl className="co-spec-descriptor--resource-requirements">
      <dt>Resource Limits</dt>
      <dd>
        <ResourceRequirementsModalLink type="limits" obj={obj} path={descriptor.path} />
      </dd>
      <dt>Resource Requests</dt>
      <dd>
        <ResourceRequirementsModalLink type="requests" obj={obj} path={descriptor.path} />
      </dd>
    </dl>
  </DetailsItem>
);

const K8sResourceLink: React.SFC<SpecCapabilityProps> = ({
  capability,
  description,
  descriptor,
  label,
  obj,
  fullPath,
  value,
}) => {
  const detail = React.useMemo(() => {
    if (!value) {
      return <span className="text-muted">None</span>;
    }

    const [, suffix] = capability.match(REGEXP_K8S_RESOURCE_SUFFIX) ?? [];
    const gvk = suffix?.replace(/:/g, '~');
    if (!_.isString(value)) {
      return (
        <>
          <YellowExclamationTriangleIcon /> Invalid spec descriptor: value at path &apos;
          {descriptor.path}&apos; must be a {gvk} resource name.
        </>
      );
    }

    return <ResourceLink kind={gvk} name={value} namespace={obj.metadata.namespace} />;
  }, [capability, descriptor.path, value, obj.metadata.namespace]);
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {detail}
    </DetailsItem>
  );
};

const BasicSelector: React.SFC<SpecCapabilityProps> = ({
  capability,
  description,
  label,
  obj,
  fullPath,
  value,
}) => (
  <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
    <Selector selector={value} kind={capability.split(SpecCapability.selector)[1]} />
  </DetailsItem>
);

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
        { op: 'add', path: `/spec/${descriptor.path.replace(/\./g, '/')}`, value: val },
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
          label="True"
          labelOff="False"
        />
        &nbsp;&nbsp;
        {checked !== Boolean(value) && confirmed && <LoadingInline />}
        {checked !== Boolean(value) && !confirmed && (
          <>
            &nbsp;&nbsp;
            <Button className="pf-m-link--align-left" type="button" variant="link" onClick={update}>
              <YellowExclamationTriangleIcon className="co-icon-space-r pf-c-button-icon--plain" />
              Confirm change
            </Button>
          </>
        )}
      </div>
      {errorMessage && (
        <div className="cos-error-title co-break-word">{errorMessage || 'An error occurred'}</div>
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
  const [checked, setChecked] = React.useState(Boolean(value));
  const [confirmed, setConfirmed] = React.useState(false);

  const patchFor = (val: boolean) => [
    { op: 'add', path: `/spec/${descriptor.path.replace('.', '/')}`, value: val },
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
              Confirm change
            </Button>
          </>
        )}
      </div>
    </DetailsItem>
  );
};

const Secret: React.FC<SpecCapabilityProps> = ({ description, label, obj, fullPath, value }) => {
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

const UpdateStrategy: React.FC<SpecCapabilityProps> = ({
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
    {value?.type ?? 'None'}
  </DetailsItem>
);

const capabilityComponents = ImmutableMap<
  SpecCapability,
  React.ComponentType<SpecCapabilityProps>
>()
  .set(SpecCapability.podCount, PodCount)
  .set(SpecCapability.endpointList, Endpoints)
  .set(SpecCapability.label, Label)
  .set(SpecCapability.namespaceSelector, NamespaceSelector)
  .set(SpecCapability.resourceRequirements, ResourceRequirements)
  .set(SpecCapability.k8sResourcePrefix, K8sResourceLink)
  .set(SpecCapability.selector, BasicSelector)
  .set(SpecCapability.booleanSwitch, BooleanSwitch)
  .set(SpecCapability.password, Secret)
  .set(SpecCapability.updateStrategy, UpdateStrategy)
  .set(SpecCapability.checkbox, CheckboxUIComponent)
  .set(SpecCapability.hidden, null);

const capabilityFor = (specCapability: SpecCapability) => {
  if (_.isEmpty(specCapability)) {
    return Default;
  }
  if (specCapability.startsWith(SpecCapability.k8sResourcePrefix)) {
    return capabilityComponents.get(SpecCapability.k8sResourcePrefix);
  }
  if (specCapability.startsWith(SpecCapability.selector)) {
    return capabilityComponents.get(SpecCapability.selector);
  }
  return capabilityComponents.get(specCapability, Default);
};

/**
 * Main entrypoint component for rendering custom UI for a given spec descriptor. This should be used instead of importing
 * individual components from this module.
 */
export const SpecDescriptor = withFallback(
  ({ model, obj, descriptor, schema, onError }: DescriptorProps) => {
    const capability = (descriptor?.['x-descriptors'] ?? []).find(
      (c) =>
        !c.startsWith(SpecCapability.fieldGroup) &&
        !c.startsWith(SpecCapability.arrayFieldGroup) &&
        !c.startsWith(SpecCapability.advanced) &&
        !c.startsWith(SpecCapability.fieldDependency),
    ) as SpecCapability;
    const CapabilityComponent = capabilityFor(capability);
    const propertySchema = getSchemaAtPath(schema, descriptor.path);
    const description = descriptor?.description || propertySchema?.description;
    const label = descriptor?.displayName || propertySchema?.title;
    const fullPath = ['spec', ..._.toPath(descriptor.path)];
    const value = _.get(obj, fullPath, descriptor.value);

    return CapabilityComponent ? (
      <dl className="olm-descriptor">
        <CapabilityComponent
          capability={capability}
          description={description}
          descriptor={descriptor}
          label={label}
          model={model}
          obj={obj}
          onError={onError}
          fullPath={fullPath}
          value={value}
        />
      </dl>
    ) : null;
  },
);

type SpecCapabilityProps = CapabilityProps<SpecCapability>;
