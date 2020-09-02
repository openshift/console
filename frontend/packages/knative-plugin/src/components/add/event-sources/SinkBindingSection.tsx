import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import { InputField, getFieldId } from '@console/shared';
import { AsyncComponent } from '@console/internal/components/utils/async';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';

interface SinkBindingSectionProps {
  title: string;
}

const SinkBindingSection: React.FC<SinkBindingSectionProps> = ({ title }) => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const initVal = values?.data?.sinkbinding?.subject?.selector?.matchLabels || {};
  const initialValueResources = !_.isEmpty(initVal)
    ? _.map(initVal, (key, val) => [val, key])
    : [['', '']];
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
      setFieldValue('data.sinkbinding.subject.selector.matchLabels', updatedNameValuePairs);
    },
    [setFieldValue],
  );
  const fieldId = getFieldId(values.type, 'subject-matchLabels');
  return (
    <FormSection title={title} extraMargin>
      <h3 className="co-section-heading-tertiary">Subject</h3>
      <InputField
        data-test-id="sinkbinding-apiversion-field"
        type={TextInputTypes.text}
        name="data.sinkbinding.subject.apiVersion"
        label="apiVersion"
        required
      />
      <InputField
        data-test-id="sinkbinding-kind-field"
        type={TextInputTypes.text}
        name="data.sinkbinding.subject.kind"
        label="Kind"
        required
      />
      <FormGroup fieldId={fieldId} label="Match Labels">
        <AsyncComponent
          loader={() =>
            import('@console/internal/components/utils/name-value-editor').then(
              (c) => c.NameValueEditor,
            )
          }
          nameValuePairs={nameValue}
          valueString="Value"
          nameString="Name"
          addLabel="Add Values"
          readOnly={false}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
        />
      </FormGroup>
    </FormSection>
  );
};

export default SinkBindingSection;
