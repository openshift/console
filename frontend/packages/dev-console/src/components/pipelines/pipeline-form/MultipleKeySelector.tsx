import * as React from 'react';
import { FieldArray, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import cx from 'classnames';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import { DropdownField, InputField, getFieldId, useFormikValidationFix } from '@console/shared';
import { TextInputTypes, Button, FormGroup } from '@patternfly/react-core';
import './MultipleKeySelector.scss';

interface MultipleKeySelectorProps {
  name: string;
  keys: { [key: string]: string };
  fullWidth?: boolean;
  required?: boolean;
}

const MultipleKeySelector: React.FC<MultipleKeySelectorProps> = ({
  name,
  keys,
  fullWidth,
  required,
}) => {
  const { values } = useFormikContext<FormikValues>();
  const items = _.get(values, name, [{ key: '', path: '' }]);
  useFormikValidationFix(items);
  return (
    <FieldArray
      name={name}
      key="parameters-row"
      render={({ push, remove }) => {
        return (
          <FormGroup
            fieldId={getFieldId(name, 'multiple-key-selector')}
            label="Items"
            className="odc-multiple-key-selector"
            isRequired={required}
          >
            {items.length > 0 &&
              items.map((item, index) => (
                <div
                  className="form-group odc-multiple-key-selector__item"
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${name}.${index}`}
                >
                  <DropdownField
                    name={`${name}.${index}.key`}
                    title="Select a key"
                    items={keys}
                    fullWidth={fullWidth}
                  />
                  <InputField
                    name={`${name}.${index}.path`}
                    type={TextInputTypes.text}
                    placeholder="Enter a path"
                  />
                  <div
                    className={cx('odc-multiple-key-selector__delete--button', {
                      'is-disabled': items.length <= 1,
                    })}
                  >
                    <MinusCircleIcon aria-hidden="true" onClick={() => remove(index)} />
                  </div>
                </div>
              ))}
            <Button
              variant="link"
              onClick={() => push({ key: '', path: '' })}
              icon={<PlusCircleIcon />}
              isInline
            >
              Add items
            </Button>
          </FormGroup>
        );
      }}
    />
  );
};

export default MultipleKeySelector;
