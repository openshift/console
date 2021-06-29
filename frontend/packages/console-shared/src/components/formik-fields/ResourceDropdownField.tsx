import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { Firehose, FirehoseResource } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useFormikValidationFix } from '../../hooks';
import ResourceDropdown, { ResourceDropdownItems } from '../dropdown/ResourceDropdown';
import { DropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';

export interface ResourceDropdownFieldProps extends DropdownFieldProps {
  dataSelector: string[] | number[] | symbol[];
  resources: FirehoseResource[];
  showBadge?: boolean;
  onLoad?: (items: ResourceDropdownItems) => void;
  onChange?: (key: string, name?: string | object, resource?: K8sResourceKind) => void;
  resourceFilter?: (resource: K8sResourceKind) => boolean;
  autoSelect?: boolean;
  placeholder?: string;
  actionItems?: {
    actionTitle: string;
    actionKey: string;
  }[];
  appendItems?: ResourceDropdownItems;
  customResourceKey?: (key: string, resource: K8sResourceKind) => string;
  dataTest?: string;
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
  dataTest,
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
      data-test={dataTest}
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
          onChange={(value: string, name: string | object, resource: K8sResourceKind) => {
            props.onChange && props.onChange(value, name, resource);
            setFieldValue(props.name, value);
            setFieldTouched(props.name, true);
          }}
        />
      </Firehose>
    </FormGroup>
  );
};

export default ResourceDropdownField;
