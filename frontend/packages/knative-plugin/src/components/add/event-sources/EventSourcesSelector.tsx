import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { ItemSelectorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { NormalizedEventSources } from '../import-types';
import { KNATIVE_EVENT_SOURCE_APIGROUP } from '../../../const';
import { getEventSourceModels } from '../../../utils/fetch-dynamic-eventsources-utils';
import { isKnownEventSource, getEventSourceData } from '../../../utils/create-eventsources-utils';
import { CREATE_APPLICATION_KEY } from '@console/dev-console/src/const';

interface EventSourcesSelectorProps {
  eventSourceList: NormalizedEventSources;
}

const EventSourcesSelector: React.FC<EventSourcesSelectorProps> = ({ eventSourceList }) => {
  const eventSourceItems = Object.keys(eventSourceList).length;
  const {
    values: {
      application: { selectedKey },
    },
    setFieldValue,
    setFieldTouched,
    validateForm,
    setErrors,
    setStatus,
  } = useFormikContext<FormikValues>();
  const handleItemChange = React.useCallback(
    (item: string) => {
      setErrors({});
      setStatus({});
      if (isKnownEventSource(item)) {
        const nameData = `data.${item.toLowerCase()}`;
        const sourceData = getEventSourceData(item.toLowerCase());
        setFieldValue(nameData, sourceData);
        setFieldTouched(nameData, true);
      }
      setFieldValue('data.itemData', eventSourceList[item]);
      const selDataModel = _.find(getEventSourceModels(), { kind: item });
      const selApiVersion = selDataModel
        ? `${selDataModel?.apiGroup}/${selDataModel?.apiVersion}`
        : `${KNATIVE_EVENT_SOURCE_APIGROUP}/v1alpha1`;
      const name = _.kebabCase(item);
      setFieldValue('name', name);
      setFieldTouched('name', true);
      if (!selectedKey || selectedKey === CREATE_APPLICATION_KEY) {
        setFieldValue('application.name', `${name}-app`);
        setFieldTouched('application.name', true);
      }
      setFieldValue('apiVersion', selApiVersion);
      setFieldTouched('apiVersion', true);
      validateForm();
    },
    [
      setErrors,
      setStatus,
      setFieldValue,
      setFieldTouched,
      selectedKey,
      validateForm,
      eventSourceList,
    ],
  );

  return (
    <FormSection title="Type" fullWidth extraMargin>
      <ItemSelectorField
        itemList={eventSourceList}
        loadingItems={!eventSourceItems}
        name="type"
        onSelect={handleItemChange}
        showIfSingle
        showFilter
        showCount
      />
    </FormSection>
  );
};

export default EventSourcesSelector;
