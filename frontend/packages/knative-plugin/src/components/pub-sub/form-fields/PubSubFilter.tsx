import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import { getFieldId } from '@console/shared';

const formatFilterData = (filters) => {
  let filterPairs: [string, any][] = [];
  for (const key in filters) {
    if (filters.hasOwnProperty(key)) {
      filterPairs = [...filterPairs, [key, filters[key]]];
    }
  }
  return filterPairs;
};

const PubSubFilter: React.FC = () => {
  const initialValueResources = [['', '']];
  const { setFieldValue, status, values } = useFormikContext<FormikValues>();
  const filters = values.formData?.spec?.filter?.attributes;
  const filterPairs = formatFilterData(filters);

  const [nameValue, setNameValue] = React.useState(
    filterPairs.length > 0 ? filterPairs : initialValueResources,
  );
  const { t } = useTranslation();
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
      setFieldValue('formData.spec.filter.attributes', updatedNameValuePairs);
    },
    [setFieldValue],
  );
  return (
    <FormGroup fieldId={getFieldId('pubsub', 'filter')} label={t('knative-plugin~Filter')} required>
      <NameValueEditor
        nameValuePairs={status.subscriberAvailable ? nameValue : []}
        valueString={t('knative-plugin~Value')}
        nameString={t('knative-plugin~Attribute')}
        readOnly={!status.subscriberAvailable}
        allowSorting={false}
        updateParentData={handleNameValuePairs}
        addString={t('knative-plugin~Add more')}
      />
    </FormGroup>
  );
};

export default PubSubFilter;
