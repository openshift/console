import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { FormControl, FormGroup, HelpBlock } from 'patternfly-react';
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

export default (props) => {
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
            >
              {_.get(parameter, 'name', key)}
            </label>
            <FormControl
              componentClass={ELEMENT_TYPES.TEXTAREA}
              bsClass="pf-c-form-control"
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
            />
            <HelpBlock>{validationMsg || null}</HelpBlock>
          </>
        );
        break;
      case ELEMENT_TYPES.CHECKBOX:
        children = (
          <>
            <div className="checkbox">
              <label>
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
            <HelpBlock>{validationMsg || null}</HelpBlock>
          </>
        );
        break;
      case ELEMENT_TYPES.DROPDOWN:
        children = (
          <>
            <label className={classNames('control-label', { 'co-required': parameter.required })}>
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
            />
            <HelpBlock>{validationMsg || null}</HelpBlock>
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
            >
              {_.get(parameter, 'name', key)}
            </label>
            <FormControl
              type="text"
              bsClass="pf-c-form-control"
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
            />
            <HelpBlock>{validationMsg || null}</HelpBlock>
          </>
        );
    }

    return (
      <FormGroup
        key={key}
        controlId={`network-type-parameters-${key}`}
        validationState={_.get(typeParamsData, `${key}.validationMsg`, null) ? 'error' : null}
      >
        {children}
      </FormGroup>
    );
  });

  return <>{dynamicContent}</>;
};
