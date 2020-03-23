import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { getFieldId, ResourceDropdownField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { knativeServingResourcesServices } from '../../../utils/create-knative-utils';

export interface SinkSectionProps {
  namespace: string;
}

const SinkSection: React.FC<SinkSectionProps> = ({ namespace }) => {
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const fieldId = getFieldId('sink-name', 'dropdown');
  const onChange = React.useCallback(
    (selectedValue) => {
      if (selectedValue) {
        setFieldTouched('sink.knativeService', true);
        setFieldValue('sink.knativeService', selectedValue);
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  return (
    <FormSection title="Sink">
      <FormGroup fieldId={fieldId} helperText="Select a Service to sink to." isRequired>
        <ResourceDropdownField
          name="sink.knativeService"
          label="Knative Service"
          resources={knativeServingResourcesServices(namespace)}
          dataSelector={['metadata', 'name']}
          fullWidth
          required
          placeholder="Knative Service"
          showBadge
          onChange={onChange}
          autocompleteFilter={autocompleteFilter}
          autoSelect
        />
      </FormGroup>
    </FormSection>
  );
};

export default SinkSection;
