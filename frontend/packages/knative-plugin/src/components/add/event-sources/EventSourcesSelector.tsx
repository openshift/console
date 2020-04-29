import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { ItemSelectorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { NormalizedEventSources } from '../import-types';
import { KNATIVE_EVENT_SOURCE_APIGROUP } from '../../../const';
import { getEventSourceModels } from '../../../utils/fetch-dynamic-eventsources-utils';
import { isKnownEventSource, getEventSourceData } from '../../../utils/create-eventsources-utils';

interface EventSourcesSelectorProps {
  eventSourceList: NormalizedEventSources;
}

const EventSourcesSelector: React.FC<EventSourcesSelectorProps> = ({ eventSourceList }) => {
  const eventSourceItems = Object.keys(eventSourceList).length;
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const handleItemChange = React.useCallback(
    (item: string) => {
      if (isKnownEventSource(item)) {
        const nameData = `data.${item.toLowerCase()}`;
        const sourceData = getEventSourceData(item.toLowerCase());
        setFieldValue(nameData, sourceData);
        setFieldTouched(nameData, true);
      }
      const selDataModel = _.find(getEventSourceModels(), { kind: item });
      const selApiVersion = selDataModel
        ? `${selDataModel?.apiGroup}/${selDataModel?.apiVersion}`
        : `${KNATIVE_EVENT_SOURCE_APIGROUP}/v1alpha1`;
      setFieldValue('name', _.kebabCase(item));
      setFieldTouched('name', true);
      setFieldValue('apiVersion', selApiVersion);
      setFieldTouched('apiVersion', true);
      validateForm();
    },
    [setFieldValue, setFieldTouched, validateForm],
  );

  const itemSelectorField = (
    <ItemSelectorField
      itemList={eventSourceList}
      loadingItems={!eventSourceItems}
      name="type"
      onSelect={handleItemChange}
      autoSelect
    />
  );

  return eventSourceItems > 1 ? (
    <FormSection title="Type" fullWidth extraMargin>
      {itemSelectorField}
    </FormSection>
  ) : (
    itemSelectorField
  );
};

export default EventSourcesSelector;
