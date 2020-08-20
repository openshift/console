import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import { pickBy, size } from 'lodash';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField } from '@console/shared';
import { RevisionItems } from '../../utils/traffic-splitting-utils';
import TrafficModalRevisionsDropdownField from './TrafficModalRevisionsDropdownField';

interface TrafficSplittingFieldProps {
  revisionItems: RevisionItems;
}

type Props = FormikProps<FormikValues> & TrafficSplittingFieldProps;

const TrafficSplittingFields: React.FC<Props> = ({ revisionItems, values }) => {
  const selectedRevisions: string[] = values.trafficSplitting.map(
    (traffic) => traffic.revisionName,
  );
  const items = pickBy(revisionItems, (revisionItem) => !selectedRevisions.includes(revisionItem));
  return (
    <MultiColumnField
      name="trafficSplitting"
      headers={[{ name: 'Split', required: true }, 'Tag', { name: 'Revision', required: true }]}
      emptyValues={{ percent: '', tag: '', revisionName: '' }}
      disableDeleteRow={values.trafficSplitting.length === 1}
      disableAddRow={values.trafficSplitting.length === size(revisionItems)}
      spans={[2, 3, 7]}
    >
      <InputField
        name="percent"
        type={TextInputTypes.number}
        style={{ maxWidth: '100%' }}
        required
      />
      <InputField name="tag" type={TextInputTypes.text} />
      <TrafficModalRevisionsDropdownField
        name="revisionName"
        revisionItems={items}
        title="Select a revision"
      />
    </MultiColumnField>
  );
};

export default TrafficSplittingFields;
