import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import SelectorCard from '@console/dev-console/src/components/import/builder/SelectorCard';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import './EventSourcesSelector.scss';

interface EventSourcesSelectorProps {
  eventSourceList: any;
}

const EventSourcesSelector: React.FC<EventSourcesSelectorProps> = ({ eventSourceList }) => {
  const { values, setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();

  const handleTypeChange = React.useCallback(
    (value: string) => {
      setFieldValue('type', value);
      setFieldTouched('type', true);
      validateForm();
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  return (
    <FormSection title="Type" fullWidth>
      <div id="event-source-selector-field" className="odc-event-source-selector">
        {_.values(eventSourceList).map((type) => (
          <SelectorCard
            key={type.name}
            image={type}
            selected={values.type === type.name}
            onChange={handleTypeChange}
          />
        ))}
      </div>
    </FormSection>
  );
};

export default EventSourcesSelector;
