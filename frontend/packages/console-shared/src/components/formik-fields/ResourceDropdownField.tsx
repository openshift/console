import type { FC } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useField, useFormikContext } from 'formik';
import { Firehose } from '@console/internal/components/utils/firehose';
import type { FirehoseResource } from '@console/internal/components/utils/types';
import { useFormikValidationFix } from '../../hooks/formik-validation-fix';
import type { ResourceDropdownProps } from '../dropdown/ResourceDropdown';
import { ResourceDropdown } from '../dropdown/ResourceDropdown';
import type { DropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';

export interface ResourceDropdownFieldProps extends DropdownFieldProps {
  dataSelector: ResourceDropdownProps['dataSelector'];
  resources: FirehoseResource[];
  showBadge?: ResourceDropdownProps['showBadge'];
  onLoad?: ResourceDropdownProps['onLoad'];
  onChange?: ResourceDropdownProps['onChange'];
  resourceFilter?: ResourceDropdownProps['resourceFilter'];
  autoSelect?: ResourceDropdownProps['autoSelect'];
  placeholder?: string;
  actionItems?: ResourceDropdownProps['actionItems'];
  appendItems?: ResourceDropdownProps['appendItems'];
  customResourceKey?: ResourceDropdownProps['customResourceKey'];
  dataTest?: string;
  menuClassName?: ResourceDropdownProps['menuClassName'];
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
      <Firehose resources={resources}>
        <ResourceDropdown
          {...props}
          id={fieldId}
          dataSelector={dataSelector}
          selectedKey={field.value}
          isFullWidth={fullWidth}
          onLoad={onLoad}
          resourceFilter={resourceFilter}
          onChange={(value, name, resource) => {
            props.onChange && props.onChange(value, name, resource);
            setFieldValue(props.name, value);
            setFieldTouched(props.name, true);
          }}
        />
      </Firehose>

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
