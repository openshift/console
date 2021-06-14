import * as React from 'react';
import { FormGroup, TextArea, TextInput } from '@patternfly/react-core';
import * as classNames from 'classnames';
import * as _ from 'lodash';
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

  _.forOwn(paramsUpdate, (value, key) => {
    if (key === paramKey) {
      const validation = _.get(networkTypeParams[networkType], [key, 'validation'], null);

      paramsUpdate[key].validationMsg = validation ? validation(paramsUpdate) : null;
    }
  });

  setTypeParamsData(paramsUpdate);
};

const getSriovNetNodePolicyResourceNames = (sriovNetNodePoliciesData) => {
  const resourceNames = {};

  sriovNetNodePoliciesData.forEach((policy) => {
    const resourceName = _.get(policy, 'spec.resourceName', '');
    if (resourceName !== '') {
      resourceNames[resourceName] = resourceName;
    }
  });

  return resourceNames;
};

const NetworkTypeOptions = (props) => {
  const { networkType, setTypeParamsData, sriovNetNodePoliciesData, typeParamsData } = props;
  const params: NetworkTypeParams = networkType && networkTypeParams[networkType];

  if (_.isEmpty(params)) {
    return null;
  }

  if (networkType === 'sriov') {
    params.resourceName.values = getSriovNetNodePolicyResourceNames(sriovNetNodePoliciesData);
  }

  const dynamicContent = _.map(params, (parameter, key) => {
    const validationMsg = _.get(typeParamsData, [key, 'validationMsg'], null);
    const elemType = _.get(parameter, 'type');

    let children;
    switch (elemType) {
      case ELEMENT_TYPES.TEXTAREA:
        children = (
          <>
            <label
              className={classNames('control-label', {
                'co-required': parameter.required,
              })}
              id={`network-type-params-${key}-label`}
            >
              {_.get(parameter, 'name', key)}
            </label>
            <TextArea
              value={_.get(typeParamsData, `${key}.value`, '')}
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
            {validationMsg && <div className="text-secondary">{validationMsg}</div>}
          </>
        );
        break;
      case ELEMENT_TYPES.CHECKBOX:
        children = (
          <>
            <div className="checkbox">
              <label id={`network-type-params-${key}-label`}>
                <input
                  type="checkbox"
                  className="create-storage-class-form__checkbox"
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
                  checked={_.get(typeParamsData, `${key}.value`, false)}
                  id={`network-type-params-${key}-checkbox`}
                />
                {_.get(parameter, 'name', key)}
              </label>
            </div>
            {validationMsg && <div className="text-secondary">{validationMsg}</div>}
          </>
        );
        break;
      case ELEMENT_TYPES.DROPDOWN:
        children = (
          <>
            <label
              className={classNames('control-label', { 'co-required': parameter.required })}
              id={`network-type-params-${key}-label`}
            >
              {_.get(parameter, 'name', key)}
            </label>
            <Dropdown
              title={parameter.hintText}
              items={parameter.values}
              dropDownClassName="dropdown--full-width"
              selectedKey={_.get(typeParamsData, `${key}.value`)}
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
            {validationMsg && <div className="text-secondary">{validationMsg}</div>}
          </>
        );
        break;
      case ELEMENT_TYPES.TEXT:
      default:
        children = (
          <>
            <label
              className={classNames('control-label', {
                'co-required': parameter.required,
              })}
              id={`network-type-params-${key}-label`}
            >
              {_.get(parameter, 'name', key)}
            </label>
            <TextInput
              type="text"
              value={_.get(typeParamsData, `${key}.value`, '')}
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
            {validationMsg && <div className="text-secondary">{validationMsg}</div>}
          </>
        );
    }

    return (
      <FormGroup
        key={key}
        fieldId={`network-type-parameters-${key}`}
        validated={_.get(typeParamsData, `${key}.validationMsg`, null) ? 'error' : null}
      >
        {children}
      </FormGroup>
    );
  });

  return <>{dynamicContent}</>;
};

export default NetworkTypeOptions;
