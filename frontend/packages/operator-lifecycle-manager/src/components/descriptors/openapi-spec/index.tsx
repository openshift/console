import * as React from 'react';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { Button, Switch } from '@patternfly/react-core';
import { LoadingInline } from '@console/internal/components/utils';
import { k8sPatch } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import {
  OpenApiCapabilityProps,
  OpenApiFieldsDescriptorProps,
  OpenApiSpecCapability,
} from './types';

const Default: React.SFC<OpenApiSpecCapabilityProps> = ({ value }) => {
  if (_.isEmpty(value) && !_.isNumber(value)) {
    return <span className="text-muted">None</span>;
  }
  if (_.isObject(value)) {
    return <span className="text-muted">Unsupported</span>;
  }
  return <span>{_.toString(value)}</span>;
};

const label: React.SFC<OpenApiSpecCapabilityProps> = ({ value }) => <span>{value || '--'}</span>;

const BooleanSwitch: React.FC<OpenApiSpecCapabilityProps> = (props) => {
  const [value, setValue] = React.useState(props.value);
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
      <Switch
        id={props.descriptor.path}
        isChecked={value}
        onChange={(val) => {
          setValue(val);
          setConfirmed(false);
        }}
        label="True"
        labelOff="False"
      />
      &nbsp;&nbsp;
      {value !== props.value && confirmed && <LoadingInline />}
      {value !== props.value && !confirmed && (
        <React.Fragment>
          &nbsp;&nbsp;
          <Button className="pf-m-link--align-left" type="button" variant="link" onClick={update}>
            <YellowExclamationTriangleIcon className="co-icon-space-r pf-c-button-icon--plain" />
            Confirm change
          </Button>
        </React.Fragment>
      )}
    </div>
  );
};

const capabilityComponents = ImmutableMap<
  OpenApiSpecCapability,
  React.ComponentType<OpenApiSpecCapabilityProps>
>()
  .set(OpenApiSpecCapability.text, label)
  .set(OpenApiSpecCapability.number, label)
  .set(OpenApiSpecCapability.booleanSwitch, BooleanSwitch);

const capabilityFor = (openApiSpecCapability: OpenApiSpecCapability) => {
  if (_.isEmpty(openApiSpecCapability)) {
    return Default;
  }
  return capabilityComponents.get(openApiSpecCapability, Default);
};

export const OpenAPIFieldsDescriptor: React.SFC<OpenApiFieldsDescriptorProps> = (props) => {
  const { model, obj, descriptor, value, namespace } = props;
  const capability = _.get(descriptor, ['capabilities', 0], null) as OpenApiSpecCapability;
  const Capability = capabilityFor(capability);

  return (
    <dl className="olm-descriptor">
      <div style={{ width: 'max-content' }}>
        <dt className="olm-descriptor__title">{descriptor.displayName}</dt>
      </div>
      <dd className="olm-descriptor__value">
        <Capability
          descriptor={descriptor}
          capability={capability}
          value={value}
          namespace={namespace}
          model={model}
          obj={obj}
        />
      </dd>
    </dl>
  );
};

type OpenApiSpecCapabilityProps = OpenApiCapabilityProps<OpenApiSpecCapability>;
