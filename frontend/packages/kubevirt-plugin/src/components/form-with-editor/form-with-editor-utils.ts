import yamlParser from 'js-yaml';
import { cloneDeep, get, isEmpty, set } from 'lodash';
import * as React from 'react';

export enum EditorPosition {
  top = 'top',
  bottom = 'bottom',
  left = 'left',
  right = 'right',
}

export enum ViewComponent {
  form = 'form',
  editor = 'editor',
  sideBySide = 'sideBySide',
}

export type FieldsMapper = {
  [key: string]: { path: string; isArray?: boolean };
};

export type FormOnChange = (
  elementId: string,
  accessKey: string | number,
  newValue: any,
  event: React.SyntheticEvent,
) => void;

export const formModifier = (
  formChildren: React.ReactNode,
  fieldsMapper: FieldsMapper,
  data: string,
  setData: Function,
  setAlert: Function,
  alertTitle: string,
  onFormChange?: FormOnChange,
): React.ReactNode[] => {
  const mapperKey = (id: string) =>
    Object.keys(fieldsMapper).find((key) => new RegExp(key).test(id));

  const form = (children: React.ReactNode) =>
    React.Children.toArray(children)?.map((child) => {
      const props = {};

      if (!React.isValidElement(child)) return child;

      const js = {};
      try {
        Object.assign(js, yamlParser.load(data));
        alert && setAlert('');
      } catch (e) {
        isEmpty(alert) && setAlert(alertTitle);
      }
      const { path, isArray } = fieldsMapper?.[mapperKey(child?.props?.id)] || {};
      const replaceValueInArray = (arr: any, idx: any, value: any) => {
        const clonedArray = cloneDeep(arr);
        clonedArray[Number(idx)] = value || '';
        return clonedArray;
      };

      const onChangeValue = (newValue: any, event: any) => {
        const deep = cloneDeep(js) || {};
        const updatedData = {};
        if (isArray) {
          const newData = set(
            deep,
            path,
            replaceValueInArray(get(deep, path) || [], child?.props?.accessKey, newValue),
          );
          Object.assign(updatedData, newData);
        } else {
          Object.assign(updatedData, set(deep, path, newValue));
        }

        setData(yamlParser.dump(updatedData));
        child?.props?.onChange && child.props.onChange(newValue, event);
        onFormChange && onFormChange(child?.props?.id, child?.props?.accessKey, newValue, event);
      };
      if (mapperKey(child?.props?.id)) {
        const value = get(js, path);
        switch ((child?.type as React.ComponentType)?.displayName) {
          case 'Switch':
            Object.assign(props, {
              isChecked: value,
              isDisabled: alert,
              onChange: onChangeValue,
            });
            break;
          default: {
            Object.assign(props, {
              value: isArray ? value?.[child?.props?.accessKey] : value || '',
              isDisabled: alert,
              onChange: onChangeValue,
            });
          }
        }
      }

      return React.cloneElement(
        child,
        props,
        child?.props?.children ? form(child?.props?.children) : null,
      );
    });

  return form(formChildren);
};
