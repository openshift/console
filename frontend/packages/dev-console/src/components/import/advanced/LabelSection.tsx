import * as React from 'react';
import * as _ from 'lodash';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import { useFormikContext, FormikValues } from 'formik';
import FormSection from '../section/FormSection';

const LabelSection: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const labels = _.isEmpty(values.labels) ? [['', '']] : _.toPairs(values.labels);
  return (
    <FormSection title="Labels" subTitle="Each label is applied to each created resource." divider>
      <NameValueEditor
        nameString="Name"
        valueString="Value"
        addString="Add Label"
        allowSorting
        nameValuePairs={labels}
        updateParentData={(obj) => setFieldValue('labels', _.fromPairs(obj.nameValuePairs))}
        useLoadingInline
        readOnly={false}
      />
    </FormSection>
  );
};

export default LabelSection;
