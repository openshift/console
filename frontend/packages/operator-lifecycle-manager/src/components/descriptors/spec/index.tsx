import * as React from 'react';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { Button, Switch, Tooltip, Checkbox } from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon, PencilAltIcon } from '@patternfly/react-icons';
import { LoadingInline, ResourceLink, Selector } from '@console/internal/components/utils';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { k8sPatch, k8sUpdate } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { SecretValue } from '@console/internal/components/configmap-and-secret-data';
import { CapabilityProps, DescriptorProps, SpecCapability, Error } from '../types';
import { ResourceRequirementsModalLink } from './resource-requirements';
import { EndpointList } from './endpoint';
import { configureSizeModal } from './configure-size';
import { configureUpdateStrategyModal } from './configure-update-strategy';

const Default: React.SFC<SpecCapabilityProps> = ({ value }) => {
  if (_.isEmpty(value) && !_.isNumber(value) && !_.isBoolean(value)) {
    return <span className="text-muted">None</span>;
  }
  if (_.isObject(value)) {
    return <span className="text-muted">Unsupported</span>;
  }
  return <span>{_.toString(value)}</span>;
};

const PodCount: React.SFC<SpecCapabilityProps> = ({ model, obj, descriptor, value }) => (
  <Button
    isInline
    type="button"
    onClick={() =>
      configureSizeModal({
        kindObj: model,
        resource: obj,
        specDescriptor: descriptor,
        specValue: value,
      })
    }
    variant="link"
  >
    {value} pods
    <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
  </Button>
);

const Endpoints: React.SFC<SpecCapabilityProps> = ({ value }) => <EndpointList endpoints={value} />;

const Label: React.SFC<SpecCapabilityProps> = ({ value }) => <span>{value || '--'}</span>;

const NamespaceSelector: React.SFC<SpecCapabilityProps> = ({ value }) =>
  _.get(value, 'matchNames[0]') ? (
    <ResourceLink kind="Namespace" name={value.matchNames[0]} title={value.matchNames[0]} />
  ) : (
    <span className="text-muted">None</span>
  );

const ResourceRequirements: React.SFC<SpecCapabilityProps> = ({ obj, descriptor }) => (
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
);

const K8sResourceLink: React.SFC<SpecCapabilityProps> = (props) => {
  if (!props.value) {
    return <span className="text-muted">None</span>;
  }

  const kind = props.capability.split(SpecCapability.k8sResourcePrefix)[1];
  if (!_.isString(props.value)) {
    return (
      <>
        <YellowExclamationTriangleIcon /> Invalid spec descriptor: value at path &apos;
        {props.descriptor.path}&apos; must be a {kind} resource name.
      </>
    );
  }

  return <ResourceLink kind={kind} name={props.value} namespace={props.namespace} />;
};

const BasicSelector: React.SFC<SpecCapabilityProps> = ({ value, capability }) => (
  <Selector selector={value} kind={capability.split(SpecCapability.selector)[1]} />
);

const BooleanSwitch: React.FC<SpecCapabilityProps> = (props) => {
  const { model, obj, descriptor, onHandleError } = props;
  const convertedValue = !_.isNil(props.value) ? props.value : false;
  const [value, setValue] = React.useState(convertedValue);
  const [confirmed, setConfirmed] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState(null);

  const errorCb = (err: Error): void => {
    setConfirmed(false);
    setValue(convertedValue);
    setErrorMessage(err.message);
    onHandleError(err.message);
  };

  const update = () => {
    setConfirmed(true);
    setErrorMessage(null);

    if (_.has(obj, `spec.${descriptor.path}`)) {
      const patchFor = (val: boolean) => [
        { op: 'add', path: `/spec/${descriptor.path.replace(/\./g, '/')}`, value: val },
      ];
      return k8sPatch(model, obj, patchFor(value)).catch((err) => errorCb(err));
    }

    const newObj = _.cloneDeep(obj);
    _.set(newObj, `spec.${descriptor.path}`, value);
    return k8sUpdate(model, newObj).catch((err) => errorCb(err));
  };

  return (
    <>
      <div className="co-spec-descriptor--switch">
        <Switch
          id={descriptor.path}
          isChecked={value}
          onChange={(val) => {
            setValue(val);
            setConfirmed(false);
            setErrorMessage(null);
            onHandleError(null);
          }}
          label="True"
          labelOff="False"
        />
        &nbsp;&nbsp;
        {value !== convertedValue && confirmed && <LoadingInline />}
        {value !== convertedValue && !confirmed && (
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
    </>
  );
};

const CheckboxUIComponent: React.FC<SpecCapabilityProps> = (props) => {
  const convertedValue = !_.isNil(props.value) ? props.value : false;
  const [value, setValue] = React.useState(convertedValue);
  const [confirmed, setConfirmed] = React.useState(false);

  const patchFor = (val: boolean) => [
    { op: 'add', path: `/spec/${props.descriptor.path.replace('.', '/')}`, value: val },
  ];
  const update = () => {
    setConfirmed(true);
    return k8sPatch(props.model, props.obj, patchFor(value));
  };

  return (
    <div className="co-spec-descriptor--switch">
      <Checkbox
        id={props.descriptor.path}
        style={{ marginLeft: '10px' }}
        isChecked={value}
        label={props.descriptor.displayName}
        onChange={(val) => {
          setValue(val);
          setConfirmed(false);
        }}
      />
      &nbsp;&nbsp;
      {value !== convertedValue && confirmed && <LoadingInline />}
      {value !== convertedValue && !confirmed && (
        <>
          &nbsp;&nbsp;
          <Button className="pf-m-link--align-left" type="button" variant="link" onClick={update}>
            <YellowExclamationTriangleIcon className="co-icon-space-r pf-c-button-icon--plain" />
            Confirm change
          </Button>
        </>
      )}
    </div>
  );
};

const Secret: React.FC<SpecCapabilityProps> = (props) => {
  const [reveal, setReveal] = React.useState(false);

  return (
    <>
      <Button type="button" onClick={() => setReveal(!reveal)}>
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
      <SecretValue value={props.value} encoded={false} reveal={reveal} />
    </>
  );
};

const UpdateStrategy: React.FC<SpecCapabilityProps> = ({ model, obj, descriptor, value }) => (
  <Button
    type="button"
    variant="link"
    isInline
    onClick={() =>
      configureUpdateStrategyModal({
        kindObj: model,
        resource: obj,
        specDescriptor: descriptor,
        specValue: value,
      })
    }
  >
    {_.get(value, 'type', 'None')}
    <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
  </Button>
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
export const SpecDescriptor = withFallback((props: DescriptorProps) => {
  const { model, obj, descriptor, value, namespace, onHandleError } = props;
  const capability = _.get(descriptor, ['x-descriptors'], []).find(
    (c) =>
      !c.startsWith(SpecCapability.fieldGroup) &&
      !c.startsWith(SpecCapability.arrayFieldGroup) &&
      !c.startsWith(SpecCapability.advanced) &&
      !c.startsWith(SpecCapability.fieldDependency),
  ) as SpecCapability;
  const Capability = capabilityFor(capability);

  return Capability ? (
    <dl className="olm-descriptor">
      <Tooltip content={descriptor.description}>
        <dt className="olm-descriptor__title" data-test-descriptor-label={descriptor.displayName}>
          {descriptor.displayName}
        </dt>
      </Tooltip>
      <dd className="olm-descriptor__value">
        <Capability
          descriptor={descriptor}
          capability={capability}
          value={value}
          namespace={namespace}
          model={model}
          obj={obj}
          onHandleError={onHandleError}
        />
      </dd>
    </dl>
  ) : null;
});

type SpecCapabilityProps = CapabilityProps<SpecCapability>;
