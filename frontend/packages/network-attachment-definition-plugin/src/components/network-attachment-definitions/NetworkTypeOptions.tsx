import * as React from 'react';
import { FormGroup, TextArea, TextInput } from '@patternfly/react-core';
import * as classNames from 'classnames';
import { isEmpty } from 'lodash';
import { Dropdown } from '@console/internal/components/utils';
import { ELEMENT_TYPES, networkTypeParams, NetworkTypeParams } from '../../constants';

const handleTypeParamChange = (
  paramKey,
  event,
  elemType,
  networkType,
  setTypeParamsData,
  typeParamsData,
) => {
  const paramsUpdate = { ...typeParamsData };

  if (elemType === ELEMENT_TYPES.CHECKBOX) {
    paramsUpdate[paramKey] = { value: event.target.checked };
  } else if (event.target) {
    paramsUpdate[paramKey] = { value: event.target.value };
  } else {
    paramsUpdate[paramKey] = { value: event };
  }

  const validation = networkTypeParams?.[networkType]?.[paramKey]?.validation;
  paramsUpdate[paramKey].validationMsg = validation ? validation(paramsUpdate) : null;
  setTypeParamsData(paramsUpdate);
};

const getSriovNetNodePolicyResourceNames = (sriovNetNodePoliciesData) => {
  const resourceNames = {};

  sriovNetNodePoliciesData.forEach((policy) => {
    const resourceName = policy?.spec?.resourceName || '';
    if (resourceName !== '') {
      resourceNames[resourceName] = resourceName;
    }
  });

  return resourceNames;
};

const NetworkTypeOptions = (props) => {
  const { networkType, setTypeParamsData, sriovNetNodePoliciesData, typeParamsData } = props;
  const params: NetworkTypeParams = networkType && networkTypeParams[networkType];

  if (isEmpty(params)) {
    return null;
  }

  if (networkType === 'sriov') {
    params.resourceName.values = getSriovNetNodePolicyResourceNames(sriovNetNodePoliciesData);
  }

  const dynamicContent = Object.entries(params).map(([key, parameter]) => {
    const typeParamsDataValue = typeParamsData?.[key]?.value;
    const typeParamsDataValidationMsg = typeParamsData?.[key]?.validationMsg;
    const { type, name } = parameter;
    const value = typeParamsDataValue ?? parameter?.initValue;

    let children;
    switch (type) {
      case ELEMENT_TYPES.TEXTAREA:
        children = (
          <div className="kv-nad-form-field--spacer">
            <label
              className={classNames('control-label', {
                'co-required': parameter.required,
              })}
              id={`network-type-params-${key}-label`}
            >
              {name}
            </label>
            <TextArea
              value={value}
              onChange={(event) =>
                handleTypeParamChange(
                  key,
                  event,
                  ELEMENT_TYPES.TEXTAREA,
                  networkType,
                  setTypeParamsData,
                  typeParamsData,
                )
              }
              id={`network-type-params-${key}-textarea`}
            />
            {typeParamsDataValidationMsg && (
              <div className="text-secondary">{typeParamsDataValidationMsg}</div>
            )}
          </div>
        );
        break;
      case ELEMENT_TYPES.CHECKBOX:
        children = (
          <div className="kv-nad-form-field--spacer">
            <div className="checkbox">
              <label id={`network-type-params-${key}-label`}>
                <input
                  type="checkbox"
                  className="create-storage-class-form__checkbox kv-nad-form-checkbox--alignment"
                  onChange={(event) =>
                    handleTypeParamChange(
                      key,
                      event,
                      ELEMENT_TYPES.CHECKBOX,
                      networkType,
                      setTypeParamsData,
                      typeParamsData,
                    )
                  }
                  checked={value}
                  id={`network-type-params-${key}-checkbox`}
                />
                {name}
              </label>
            </div>
            {typeParamsDataValidationMsg && (
              <div className="text-secondary">{typeParamsDataValidationMsg}</div>
            )}
          </div>
        );
        break;
      case ELEMENT_TYPES.DROPDOWN:
        children = (
          <div className="kv-nad-form-field--spacer">
            <label
              className={classNames('control-label', { 'co-required': parameter.required })}
              id={`network-type-params-${key}-label`}
            >
              {name}
            </label>
            <Dropdown
              title={parameter.hintText}
              items={parameter.values}
              dropDownClassName="dropdown--full-width"
              selectedKey={value}
              onChange={(event) =>
                handleTypeParamChange(
                  key,
                  event,
                  ELEMENT_TYPES.DROPDOWN,
                  networkType,
                  setTypeParamsData,
                  typeParamsData,
                )
              }
              id={`network-type-params-${key}-dropdown`}
            />
            {typeParamsDataValidationMsg && (
              <div className="text-secondary">{typeParamsDataValidationMsg}</div>
            )}
          </div>
        );
        break;
      case ELEMENT_TYPES.TEXT:
      default:
        children = (
          <div className="kv-nad-form-field--spacer">
            <label
              className={classNames('control-label', {
                'co-required': parameter.required,
              })}
              id={`network-type-params-${key}-label`}
            >
              {name}
            </label>
            <TextInput
              type="text"
              value={value}
              onChange={(event) =>
                handleTypeParamChange(
                  key,
                  event,
                  ELEMENT_TYPES.TEXT,
                  networkType,
                  setTypeParamsData,
                  typeParamsData,
                )
              }
              id={`network-type-params-${key}-text`}
            />
            {typeParamsDataValidationMsg && (
              <div className="text-secondary">{typeParamsDataValidationMsg}</div>
            )}
          </div>
        );
    }

    return (
      <FormGroup
        key={key}
        fieldId={`network-type-parameters-${key}`}
        validated={typeParamsData?.[key]?.validationMsg}
      >
        {children}
      </FormGroup>
    );
  });

  return <>{dynamicContent}</>;
};

export default NetworkTypeOptions;
