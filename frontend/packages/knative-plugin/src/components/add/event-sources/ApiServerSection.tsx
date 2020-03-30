import * as React from 'react';
import * as _ from 'lodash';
import * as fuzzy from 'fuzzysearch';
import { useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { ServiceAccountModel } from '@console/internal/models';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import { ResourceDropdownField, DropdownField, getFieldId } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';

interface ApiServerSectionProps {
  namespace: string;
}

const ApiServerSection: React.FC<ApiServerSectionProps> = ({ namespace }) => {
  const { values, setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const initVal = values?.data?.apiserversource?.resources || [];
  const initialValueResources = !_.isEmpty(initVal)
    ? initVal.map((val) => _.values(val))
    : [['', '']];
  const [nameValue, setNameValue] = React.useState(initialValueResources);
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
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
  const onChange = React.useCallback(
    (selectedValue) => {
      if (selectedValue) {
        setFieldTouched('data.apiserversource.serviceAccountName', true);
        setFieldValue('data.apiserversource.serviceAccountName', selectedValue);
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  const resources = [
    {
      isList: true,
      kind: ServiceAccountModel.kind,
      namespace,
      prop: ServiceAccountModel.id,
      optional: true,
    },
  ];
  const modeItems = {
    Ref: 'Ref',
    Resource: 'Resource',
  };
  const fieldId = getFieldId(values.type, 'res-input');
  return (
    <FormSection title="ApiServerSource">
      <FormGroup fieldId={fieldId} label="Resource" isRequired>
        <NameValueEditor
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
        title={modeItems.Ref}
        fullWidth
      />
      <ResourceDropdownField
        name="data.apiserversource.serviceAccountName"
        label="Service Account Name"
        resources={resources}
        dataSelector={['metadata', 'name']}
        fullWidth
        placeholder="Select Service Account Name"
        onChange={onChange}
        autocompleteFilter={autocompleteFilter}
        autoSelect
        showBadge
      />
    </FormSection>
  );
};

export default ApiServerSection;
