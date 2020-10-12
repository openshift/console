import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { DropdownField, getFieldId } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import ServiceAccountDropdown from '../../dropdowns/ServiceAccountDropdown';
import { EventSources } from '../import-types';

interface ApiServerSectionProps {
  title: string;
}

const ApiServerSection: React.FC<ApiServerSectionProps> = ({ title }) => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const initVal = values?.data?.[EventSources.ApiServerSource]?.resources || [];
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
      setFieldValue(`data.${EventSources.ApiServerSource}.resources`, updatedNameValuePairs);
    },
    [setFieldValue],
  );
  const modeItems = {
    Ref: 'Ref',
    Resource: 'Resource',
  };
  const fieldId = getFieldId(values.type, 'res-input');
  return (
    <FormSection title={title} extraMargin>
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
        name={`data.${EventSources.ApiServerSource}.mode`}
        label="Mode"
        items={modeItems}
        title={modeItems.Ref}
        helpText="The mode the receive adapter controller runs under"
        fullWidth
      />
      <ServiceAccountDropdown name={`data.${EventSources.ApiServerSource}.serviceAccountName`} />
    </FormSection>
  );
};

export default ApiServerSection;
