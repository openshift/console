import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField, DropdownField } from '@console/shared';
import { RevisionItems } from '../../utils/traffic-splitting-utils';

interface TrafficSplittingFieldProps {
  revisionItems: RevisionItems;
}

type Props = FormikProps<FormikValues> & TrafficSplittingFieldProps;

const TrafficSplittingFields: React.FC<Props> = ({ revisionItems, values }) => {
  return (
    <MultiColumnField
      name="trafficSplitting"
      addLabel="Add Revision"
      headers={[{ name: 'Split', required: true }, 'Tag', { name: 'Revision', required: true }]}
      emptyValues={{ percent: '', tag: '', revisionName: '' }}
      disableDeleteRow={values.trafficSplitting.length === 1}
      spans={[2, 3, 7]}
    >
      <InputField
        name="percent"
        type={TextInputTypes.number}
        style={{ maxWidth: '100%' }}
        required
      />
      <InputField name="tag" type={TextInputTypes.text} />
      <DropdownField
        name="revisionName"
        items={revisionItems}
        title="Select a revision"
        fullWidth
        required
      />
    </MultiColumnField>
  );
};

export default TrafficSplittingFields;
