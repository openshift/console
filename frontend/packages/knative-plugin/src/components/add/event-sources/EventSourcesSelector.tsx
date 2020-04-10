import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { ItemSelectorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { NormalizedEventSources } from '../import-types';
import { getEventSourceData } from '../../../utils/create-eventsources-utils';
import { KNATIVE_EVENT_SOURCE_APIGROUP } from '../../../const';
import { getEventSourceModelsData } from '../../../utils/fetch-dynamic-eventsources-utils';

interface EventSourcesSelectorProps {
  eventSourceList: NormalizedEventSources;
}

const EventSourcesSelector: React.FC<EventSourcesSelectorProps> = ({ eventSourceList }) => {
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const eventSourceItems = Object.keys(eventSourceList).length;
  const handleItemChange = React.useCallback(
    (item: string) => {
      const nameData = `data.${item.toLowerCase()}`;
      const sourceData = getEventSourceData(item.toLowerCase());
      const selDataModel = _.find(getEventSourceModelsData(), { kind: item });
      const selApiVersion = selDataModel
        ? `${selDataModel?.apiGroup}/${selDataModel?.apiVersion}`
        : `${KNATIVE_EVENT_SOURCE_APIGROUP}/v1alpha1`;
      setFieldValue(nameData, sourceData);
      setFieldTouched(nameData, true);
      setFieldValue('name', _.kebabCase(item));
      setFieldTouched('name', true);
      setFieldValue('apiVersion', selApiVersion);
      setFieldTouched('apiVersion', true);
      validateForm();
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  return (
    <FormSection title="Type" fullWidth>
      <ItemSelectorField
        itemList={eventSourceList}
        loadingItems={!eventSourceItems}
        name="type"
        onSelect={handleItemChange}
        autoSelect
      />
    </FormSection>
  );
};

export default EventSourcesSelector;
