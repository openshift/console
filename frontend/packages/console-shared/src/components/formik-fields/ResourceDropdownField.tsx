import * as React from 'react';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Firehose, FirehoseResource } from '@console/internal/components/utils';
import ResourceDropdown, { ResourceDropdownItems } from '../dropdown/ResourceDropdown';
import { DropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';
import { useFormikValidationFix } from '../../hooks';

export interface ResourceDropdownFieldProps extends DropdownFieldProps {
  dataSelector: string[] | number[] | symbol[];
  resources: FirehoseResource[];
  showBadge?: boolean;
  onLoad?: (items: ResourceDropdownItems) => void;
  onChange?: (key: string, name?: string | object) => void;
  resourceFilter?: (resource: K8sResourceKind) => boolean;
  autoSelect?: boolean;
  placeholder?: string;
  actionItems?: {
    actionTitle: string;
    actionKey: string;
  }[];
  appendItems?: ResourceDropdownItems;
}

const ResourceDropdownField: React.FC<ResourceDropdownFieldProps> = ({
  label,
  helpText,
  required,
  fullWidth,
  dataSelector,
  resources,
  onLoad,
  resourceFilter,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'ns-dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  useFormikValidationFix(field.value);

  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      validated={isValid ? 'default' : 'error'}
      isRequired={required}
    >
      <Firehose resources={resources}>
        <ResourceDropdown
          {...props}
          id={fieldId}
          dataSelector={dataSelector}
          selectedKey={field.value}
          dropDownClassName={cx({ 'dropdown--full-width': fullWidth })}
          onLoad={onLoad}
          resourceFilter={resourceFilter}
          onChange={(value: string, name) => {
            props.onChange && props.onChange(value, name);
            setFieldValue(props.name, value);
            setFieldTouched(props.name, true);
          }}
        />
      </Firehose>
    </FormGroup>
  );
};

export default ResourceDropdownField;
