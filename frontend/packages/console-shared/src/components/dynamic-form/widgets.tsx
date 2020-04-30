import * as _ from 'lodash';
import * as React from 'react';
import { Checkbox } from '@patternfly/react-core';
import { WidgetProps } from 'react-jsonschema-form';
import { NumberSpinner, ListDropdown, Dropdown } from '@console/internal/components/utils';
import { K8sKind, GroupVersionKind, ImagePullPolicy } from '@console/internal/module/k8s';
import { RadioGroup } from '@console/internal/components/radio';

export const TextWidget: React.FC<WidgetProps> = ({
  disabled = false,
  id,
  onBlur,
  onChange,
  onFocus,
  readonly = false,
  required = false,
  value = '',
}) => {
  return (
    <input
      className="pf-c-form-control"
      disabled={disabled}
      id={id}
      key={id}
      onBlur={onBlur && ((event) => onBlur(id, event.target.value))}
      onChange={({ currentTarget }) => onChange(currentTarget.value)}
      onFocus={onFocus && ((event) => onFocus(id, event.target.value))}
      readOnly={readonly}
      required={required}
      type="text"
      value={value}
    />
  );
};

export const NumberWidget: React.FC<WidgetProps> = ({ value, id, onChange }) => {
  const numberValue = _.toNumber(value);
  return (
    <input
      className="pf-c-form-control"
      id={id}
      key={id}
      onChange={({ currentTarget }) =>
        onChange(currentTarget.value !== '' ? _.toNumber(currentTarget.value) : '')
      }
      type="number"
      value={_.isFinite(numberValue) ? numberValue : ''}
    />
  );
};

export const PasswordWidget: React.FC<WidgetProps> = ({ value = '', id, onChange }) => {
  return (
    <input
      className="pf-c-form-control"
      key={id}
      id={id}
      type="password"
      onChange={({ currentTarget }) => onChange(currentTarget.value)}
      value={value}
    />
  );
};

export const CheckboxWidget: React.FC<WidgetProps> = ({
  value = false,
  id,
  label,
  onChange,
  required,
}) => {
  return (
    <Checkbox
      id={id}
      key={id}
      isChecked={value}
      label={label}
      required={required}
      onChange={(checked) => onChange(checked)}
    />
  );
};

export const PodCountWidget: React.FC<WidgetProps> = ({ value, id, onChange }) => {
  return (
    <NumberSpinner
      id={id}
      className="pf-c-form-control"
      value={value}
      onChange={({ currentTarget }) => onChange(_.toInteger(currentTarget.value))}
      changeValueBy={(operation) => onChange(_.toInteger(value) + operation)}
      autoFocus
      required
    />
  );
};

export const K8sResourceWidget: React.FC<K8sResourceWidgetProps> = ({
  value,
  id,
  label,
  options,
  formContext,
  onChange,
}) => {
  const { model, groupVersionKind } = options;
  const { namespace } = formContext;
  const selectedKey = value ? `${value}-${model.kind}` : null;

  return (
    <div>
      {!_.isUndefined(model) ? (
        <ListDropdown
          key={id}
          id={id}
          resources={[{ kind: groupVersionKind, namespace: model.namespaced ? namespace : null }]}
          desc={label}
          placeholder={`Select ${model.label}`}
          onChange={(next) => onChange(next)}
          selectedKey={selectedKey}
        />
      ) : (
        <span>Cluster does not have resource {groupVersionKind}</span>
      )}
    </div>
  );
};

export const ImagePullPolicyWidget: React.FC<WidgetProps> = ({ id, value, onChange }) => {
  return (
    <RadioGroup
      id={id}
      currentValue={value}
      items={_.values(ImagePullPolicy).map((policy) => ({
        value: policy,
        title: policy,
      }))}
      onChange={({ currentTarget }) => onChange(currentTarget.value)}
    />
  );
};

export const SelectWidget: React.FC<WidgetProps> = ({
  id,
  label,
  onChange,
  options,
  schema,
  value,
}) => {
  const { enumOptions = [], title } = options;
  const items = _.reduce(
    enumOptions as OptionsList,
    (itemAccumulator, option) => {
      return {
        ...itemAccumulator,
        [option.label]: option.value,
      };
    },
    {},
  );
  return (
    <Dropdown
      id={id}
      key={id}
      title={`Select ${title || schema?.title || label}`}
      selectedKey={value}
      items={items}
      onChange={(val) => onChange(val)}
    />
  );
};

type OptionsList = {
  label: string;
  value: string;
}[];

type K8sResourceWidgetProps = WidgetProps & {
  options: {
    model: K8sKind;
    groupVersionKind: GroupVersionKind;
  };
};

export default {
  BaseInput: TextWidget,
  CheckboxWidget,
  ImagePullPolicyWidget,
  K8sResourceWidget,
  NumberWidget,
  PasswordWidget,
  PodCountWidget,
  SelectWidget,
  TextWidget,
  int32: NumberWidget,
  int64: NumberWidget,
};
