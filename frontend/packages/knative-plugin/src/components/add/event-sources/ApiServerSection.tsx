import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { DropdownField, getFieldId } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import ServiceAccountDropdown from '../../dropdowns/ServiceAccountDropdown';

const ApiServerSection: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const initVal = values?.data?.apiserversource?.resources || [];
  const initialValueResources = !_.isEmpty(initVal)
    ? initVal.map((val) => _.values(val))
    : [['', '']];
  const [nameValue, setNameValue] = React.useState(initialValueResources);
  const handleNameValuePairs = React.useCallback(
    ({ nameValuePairs }) => {
      const updatedNameValuePairs = _.compact(
        nameValuePairs.map(([name, value]) => {
          if (value.length) {
            return { apiVersion: name, kind: value };
          }
          return null;
        }),
      );
      setNameValue(nameValuePairs);
      setFieldValue('data.apiserversource.resources', updatedNameValuePairs);
    },
    [setFieldValue],
  );
  const modeItems = {
    Reference: 'Reference',
    Resource: 'Resource',
  };
  const fieldId = getFieldId(values.type, 'res-input');
  return (
    <FormSection title="ApiServerSource" extraMargin>
      <FormGroup
        fieldId={fieldId}
        label="Resource"
        helperText="The list of resources to watch"
        isRequired
      >
        <AsyncComponent
          loader={() =>
            import('@console/internal/components/utils/name-value-editor').then(
              (c) => c.NameValueEditor,
            )
          }
          nameValuePairs={nameValue}
          valueString="kind"
          nameString="apiVersion"
          addString="Add Resource"
          readOnly={false}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
        />
      </FormGroup>
      <DropdownField
        name="data.apiserversource.mode"
        label="Mode"
        items={modeItems}
        title={modeItems.Reference}
        helpText="The mode the receive adapter controller runs under"
        fullWidth
      />
      <ServiceAccountDropdown name="data.apiserversource.serviceAccountName" />
    </FormSection>
  );
};

export default ApiServerSection;
