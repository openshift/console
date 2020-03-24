import * as React from 'react';
import { ItemSelectorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { NormalizedEventSources } from '../import-types';

interface EventSourcesSelectorProps {
  eventSourceList: NormalizedEventSources;
}

const EventSourcesSelector: React.FC<EventSourcesSelectorProps> = ({ eventSourceList }) => (
  <FormSection title="Type" fullWidth>
    <ItemSelectorField itemList={eventSourceList} name="type" />
  </FormSection>
);

export default EventSourcesSelector;
