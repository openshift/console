import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { ItemSelectorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { NormalizedEventSources } from '../import-types';
import { getEventSourceData } from '../../../utils/create-eventsources-utils';

interface EventSourcesSelectorProps {
  eventSourceList: NormalizedEventSources;
}

const EventSourcesSelector: React.FC<EventSourcesSelectorProps> = ({ eventSourceList }) => {
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const handleItemChange = React.useCallback(
    (item: string) => {
      const name = `data.${item.toLowerCase()}`;
      setFieldValue(name, getEventSourceData(item.toLowerCase()));
      setFieldTouched(name, true);
      validateForm();
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  return (
    <FormSection title="Type" fullWidth>
      <ItemSelectorField itemList={eventSourceList} name="type" onSelect={handleItemChange} />
    </FormSection>
  );
};

export default EventSourcesSelector;
