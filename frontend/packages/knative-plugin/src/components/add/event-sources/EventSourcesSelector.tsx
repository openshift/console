import * as React from 'react';
import * as _ from 'lodash';
import { useField, useFormikContext, FormikValues } from 'formik';
import BuilderImageCard from '@console/dev-console/src/components/import/builder/BuilderImageCard';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import './EventSourcesSelector.scss';

interface EventSourcesSelectorProps {
  eventSourceList: any;
}

const EventSourcesSelector: React.FC<EventSourcesSelectorProps> = ({ eventSourceList }) => {
  const [selected] = useField('type');
  const { values, setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const eventSourceCount = _.keys(eventSourceList).length;

  const handleImageChange = React.useCallback(
    (value: string) => {
      setFieldValue('type', value);
      setFieldTouched('type', true);
      validateForm();
    },
    [setFieldValue, setFieldTouched, validateForm],
  );

  React.useEffect(() => {
    if (!selected.value && eventSourceCount === 1) {
      const image = _.find(eventSourceList);
      handleImageChange(image.name);
    }
    if (!selected.value && values.type) {
      handleImageChange(values.type);
    }
  }, [eventSourceCount, eventSourceList, handleImageChange, selected.value, values.type]);

  if (eventSourceCount === 1) {
    return null;
  }
  return (
    <FormSection title="Type" fullWidth>
      <div id="event-source-selector-field" className="odc-event-source-selector">
        {_.values(eventSourceList).map((image) => (
          <BuilderImageCard
            key={image.name}
            image={image}
            selected={values.type === image.name}
            onChange={handleImageChange}
          />
        ))}
      </div>
    </FormSection>
  );
};

export default EventSourcesSelector;
