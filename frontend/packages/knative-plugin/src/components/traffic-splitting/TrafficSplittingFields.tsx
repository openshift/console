import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { pickBy, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import { MultiColumnField, InputField } from '@console/shared';
import { RevisionItems } from '../../utils/traffic-splitting-utils';
import TrafficModalRevisionsDropdownField from './TrafficModalRevisionsDropdownField';

interface TrafficSplittingFieldProps {
  revisionItems: RevisionItems;
}

type Props = FormikProps<FormikValues> & TrafficSplittingFieldProps;

const TrafficSplittingFields: React.FC<Props> = ({ revisionItems, values }) => {
  const { t } = useTranslation();
  const selectedRevisions: string[] = values.trafficSplitting.map(
    (traffic) => traffic.revisionName,
  );
  const items = pickBy(revisionItems, (revisionItem) => !selectedRevisions.includes(revisionItem));
  return (
    <MultiColumnField
      name="trafficSplitting"
      addLabel={t('knative-plugin~Add Revision')}
      headers={[
        { name: t('knative-plugin~Split'), required: true },
        t('knative-plugin~Tag'),
        { name: t('knative-plugin~Revision'), required: true },
      ]}
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
        title={t('knative-plugin~Select a Revision')}
      />
    </MultiColumnField>
  );
};

export default TrafficSplittingFields;
