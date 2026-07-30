import type { FC } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import { pickBy, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { MultiColumnField } from '@console/shared/src/components/formik-fields/multi-column-field/MultiColumnField';
import type { RevisionItems } from '../../utils/traffic-splitting-utils';
import TrafficModalRevisionsDropdownField from './TrafficModalRevisionsDropdownField';

interface TrafficSplittingFieldProps {
  revisionItems: RevisionItems;
}

type Props = FormikProps<FormikValues> & TrafficSplittingFieldProps;

const TrafficSplittingFields: FC<Props> = ({ revisionItems, values }) => {
  const { t } = useTranslation('knative-plugin');
  const selectedRevisions: string[] = values.trafficSplitting.map(
    (traffic) => traffic.revisionName,
  );
  const items = pickBy(revisionItems, (revisionItem) => !selectedRevisions.includes(revisionItem));
  return (
    <MultiColumnField
      name="trafficSplitting"
      addLabel={t('Add Revision')}
      headers={[
        { name: t('Split'), required: true },
        t('Tag'),
        { name: t('Revision'), required: true },
      ]}
      emptyValues={{ percent: '', tag: '', revisionName: '' }}
      disableDeleteRow={values.trafficSplitting.length === 1}
      tooltipDeleteRow={
        values.trafficSplitting.length === 1
          ? t('Service must have at least one assigned revision')
          : undefined /* default */
      }
      disableAddRow={values.trafficSplitting.length === size(revisionItems)}
      tooltipAddRow={
        values.trafficSplitting.length === size(revisionItems)
          ? t('All revisions are already set to receive traffic')
          : null /* no tooltip */
      }
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
        title={t('Select a Revision')}
      />
    </MultiColumnField>
  );
};

export default TrafficSplittingFields;
