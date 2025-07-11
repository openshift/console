/* eslint-disable @typescript-eslint/no-use-before-define */
import * as React from 'react';
import { Checkbox, Switch } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { WidgetProps } from '@rjsf/core';
import { getSchemaType } from '@rjsf/core/dist/cjs/utils';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { RadioGroup } from '@console/internal/components/radio';
import { NumberSpinner, ListDropdown, Dropdown } from '@console/internal/components/utils';
import { K8sKind, GroupVersionKind, ImagePullPolicy } from '@console/internal/module/k8s';
import { selectorFromString } from '@console/internal/module/k8s/selector';
import { JSON_SCHEMA_NUMBER_TYPES } from './const';
import { DynamicFormFieldOptionsList } from './types';

export const TextWidget: React.FC<WidgetProps> = (props) => {
  const {
    disabled = false,
    id,
    onBlur,
    onChange,
    onFocus,
    readonly = false,
    schema = {},
    value = '',
  } = props;
  const schemaType = getSchemaType(schema);
  return JSON_SCHEMA_NUMBER_TYPES.includes(schemaType) ? (
    <NumberWidget {...props} />
  ) : (
    <span
      className={css('pf-v6-c-form-control', {
        'pf-m-disabled': disabled,
        'pf-m-readonly': readonly,
      })}
    >
      <input
        disabled={disabled}
        id={id}
        key={id}
        onBlur={onBlur && ((event) => onBlur(id, event.target.value))}
        onChange={({ currentTarget }) => onChange(currentTarget.value)}
        onFocus={onFocus && ((event) => onFocus(id, event.target.value))}
        readOnly={readonly}
        type="text"
        value={value}
      />
    </span>
  );
};

export const NumberWidget: React.FC<WidgetProps> = ({ value, id, onChange }) => {
  const numberValue = _.toNumber(value);
  return (
    <span className="pf-v6-c-form-control">
      <input
        id={id}
        key={id}
        onChange={({ currentTarget }) =>
          onChange(currentTarget.value !== '' ? _.toNumber(currentTarget.value) : '')
        }
        type="number"
        value={_.isFinite(numberValue) ? numberValue : ''}
      />
    </span>
  );
};

export const PasswordWidget: React.FC<WidgetProps> = ({ value = '', id, onChange }) => {
  return (
    <span className="pf-v6-c-form-control">
      <input
        key={id}
        id={id}
        type="password"
        onChange={({ currentTarget }) => onChange(currentTarget.value)}
        value={value}
      />
    </span>
  );
};

export const CheckboxWidget: React.FC<WidgetProps> = ({ value = false, id, label, onChange }) => {
  return (
    <Checkbox
      id={id}
      key={id}
      isChecked={value}
      data-checked-state={value}
      label={label}
      onChange={(_event, checked) => onChange(checked)}
    />
  );
};

export const SwitchWidget: React.FC<WidgetProps> = ({ value, id, label, onChange, options }) => {
  const { t } = useTranslation();
  const { labelOn = t('console-shared~true') } = options;
  return (
    <Switch
      id={id || label}
      key={id || label}
      isChecked={_.isNil(value) ? false : value}
      onChange={(_event, v) => onChange(v)}
      label={labelOn as string}
    />
  );
};

export const PodCountWidget: React.FC<WidgetProps> = ({ value, id, onChange }) => {
  return (
    <NumberSpinner
      id={id}
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
  const { t } = useTranslation();
  const { model, groupVersionKind, selector } = options;
  const { namespace } = formContext;
  const selectedKey = value ? `${value}-${groupVersionKind}` : null;
  const selectorObj = React.useMemo(() => {
    try {
      return selectorFromString(selector);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        `Invalid selector string provided to K8sResourceWidget: '${selector}'. If using OLM descriptors, please validate the provided selector.`,
      );
    }
    return null;
  }, [selector]);
  return (
    <>
      {!_.isUndefined(model) ? (
        <ListDropdown
          key={id}
          id={id}
          resources={[
            {
              kind: groupVersionKind,
              selector: selectorObj,
              namespace: model.namespaced ? namespace : null,
            },
          ]}
          desc={label}
          placeholder={t('console-shared~Select {{label}}', { label: model.label })}
          onChange={(next) => onChange(next)}
          selectedKey={selectedKey}
        />
      ) : (
        <span>
          {t('console-shared~Cluster does not have resource {{groupVersionKind}}', {
            groupVersionKind,
          })}
        </span>
      )}
    </>
  );
};

export const ImagePullPolicyWidget: React.FC<WidgetProps> = ({ id, value, onChange }) => {
  return (
    <RadioGroup
      id={id}
      currentValue={value}
      items={_.values(ImagePullPolicy).map((policy) => ({
        name: id,
        value: policy,
        label: policy,
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
  const { t } = useTranslation();
  const { enumOptions = [], title } = options;
  const items = _.reduce(
    enumOptions as DynamicFormFieldOptionsList,
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
      title={t('console-shared~Select {{title}}', { title: title || schema?.title || label })}
      selectedKey={value}
      items={items}
      onChange={(val) => onChange(val)}
    />
  );
};

type K8sResourceWidgetProps = WidgetProps & {
  options: {
    model: K8sKind;
    groupVersionKind: GroupVersionKind;
    selector: string;
  };
};

export default {
  BaseInput: TextWidget,
  CheckboxWidget,
  SwitchWidget,
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
