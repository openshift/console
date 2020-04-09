import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { ItemSelectorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { NormalizedEventSources } from '../import-types';
import { getEventSourceData } from '../../../utils/create-eventsources-utils';

interface EventSourcesSelectorProps {
  eventSourceList: NormalizedEventSources;
  handleChange?: (item: string) => void;
}

const EventSourcesSelector: React.FC<EventSourcesSelectorProps> = ({
  eventSourceList,
  handleChange,
}) => {
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const eventSourceItems = Object.keys(eventSourceList).length;
  const handleItemChange = React.useCallback(
    (item: string) => {
      const nameData = `data.${item.toLowerCase()}`;
      const sourceData = getEventSourceData(item.toLowerCase());
      setFieldValue(nameData, sourceData);
      setFieldTouched(nameData, true);
      setFieldValue('name', _.kebabCase(item));
      setFieldTouched('name', true);
      validateForm();
      handleChange && handleChange(item);
    },
    [setFieldValue, setFieldTouched, validateForm, handleChange],
  );
  return (
    <FormSection title="Type" fullWidth>
      <ItemSelectorField
        itemList={eventSourceList}
        loadingItems={!eventSourceItems}
        name="type"
        onSelect={handleItemChange}
      />
    </FormSection>
  );
};

export default EventSourcesSelector;
