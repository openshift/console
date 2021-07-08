import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import { getFieldId } from '@console/shared';

const PubSubFilter: React.FC = () => {
  const initialValueResources = [['', '']];
  const { setFieldValue, status } = useFormikContext<FormikValues>();
  const [nameValue, setNameValue] = React.useState(initialValueResources);
  const handleNameValuePairs = React.useCallback(
    ({ nameValuePairs }) => {
      let updatedNameValuePairs = {};
      _.forEach(nameValuePairs, ([name, value]) => {
        if (value.length) {
          updatedNameValuePairs = { ...updatedNameValuePairs, [name]: value };
          return updatedNameValuePairs;
        }
        return updatedNameValuePairs;
      });
      setNameValue(nameValuePairs);
      setFieldValue('spec.filter.attributes', updatedNameValuePairs);
    },
    [setFieldValue],
  );
  return (
    <FormGroup fieldId={getFieldId('pubsub', 'filter')} label="Filter" required>
      <NameValueEditor
        nameValuePairs={status.subscriberAvailable ? nameValue : []}
        valueString="Value"
        nameString="Attribute"
        readOnly={!status.subscriberAvailable}
        allowSorting={false}
        updateParentData={handleNameValuePairs}
        addString="Add More"
      />
    </FormGroup>
  );
};

export default PubSubFilter;
