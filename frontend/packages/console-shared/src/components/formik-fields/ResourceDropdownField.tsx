import type { FC } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useField, useFormikContext } from 'formik';
import type { FirehoseResult } from '@console/internal/components/utils/types';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useFormikValidationFix } from '../../hooks/formik-validation-fix';
import type { ResourceDropdownItems } from '../dropdown/ResourceDropdown';
import { ResourceDropdown } from '../dropdown/ResourceDropdown';
import type { DropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';

export interface ResourceDropdownFieldProps extends DropdownFieldProps {
  dataSelector: string[] | number[] | symbol[];
  resources: FirehoseResult[];
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
  menuClassName?: string;
}

const ResourceDropdownField: FC<ResourceDropdownFieldProps> = ({
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
    <FormGroup fieldId={fieldId} label={label} isRequired={required} data-test={dataTest}>
      <ResourceDropdown
        {...props}
        id={fieldId}
        dataSelector={dataSelector}
        selectedKey={field.value}
        isFullWidth={fullWidth}
        onLoad={onLoad}
        resourceFilter={resourceFilter}
        resources={resources}
        onChange={(value: string, name: string | object, resource: K8sResourceKind) => {
          props.onChange && props.onChange(value, name, resource);
          setFieldValue(props.name, value);
          setFieldTouched(props.name, true);
        }}
      />

      <FormHelperText>
        <HelperText>
          {!isValid ? (
            <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
          ) : (
            <HelperTextItem>{helpText}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default ResourceDropdownField;
