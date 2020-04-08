import * as React from 'react';
import { safeDump } from 'js-yaml';
import { useFormikContext, FormikValues } from 'formik';
import { YAMLEditorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import {
  getEventSourcesDepResource,
  isKnownEventSource,
} from '../../../utils/create-eventsources-utils';
import { EventSourceFormData } from '../import-types';

const YAMLEditorSection: React.FC = () => {
  const { setFieldValue, setFieldTouched, values } = useFormikContext<FormikValues>();
  const formData = React.useRef(values);
  if (formData.current.type !== values.type) {
    formData.current = values;
  }

  React.useEffect(() => {
    if (!isKnownEventSource(values.type)) {
      setFieldValue(
        'yamlData',
        safeDump(getEventSourcesDepResource(formData.current as EventSourceFormData)),
      );
      setFieldTouched('yamlData', true);
    }
  }, [values.type, setFieldTouched, setFieldValue]);

  return (
    <FormSection title={values.type} flexLayout fullWidth>
      <YAMLEditorField name="yamlData" />
    </FormSection>
  );
};

export default YAMLEditorSection;
