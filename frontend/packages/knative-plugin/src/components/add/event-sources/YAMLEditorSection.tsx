import * as React from 'react';
import * as _ from 'lodash';
import { safeDump } from 'js-yaml';
import { useFormikContext, FormikValues } from 'formik';
import { YAMLEditorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import {
  getEventSourcesDepResource,
  isKnownEventSource,
} from '../../../utils/create-eventsources-utils';
import { EventSourceFormData } from '../import-types';

interface YAMLEditorSectionProps {
  title: string;
}

const YAMLEditorSection: React.FC<YAMLEditorSectionProps> = ({ title }) => {
  const { setFieldValue, setFieldTouched, values } = useFormikContext<FormikValues>();
  const formData = React.useRef(values);
  if (formData.current.type !== values.type) {
    formData.current = values;
  }

  React.useEffect(() => {
    if (!isKnownEventSource(values.type)) {
      const {
        project: { name: namespace },
        data: { itemData },
      } = formData.current;
      const yamlDumpData = _.isEmpty(itemData?.data?.almData)
        ? getEventSourcesDepResource(formData.current as EventSourceFormData)
        : {
            ...itemData.data.almData,
            metadata: { ...itemData.data.almData.metadata, namespace },
          };
      setFieldValue('yamlData', safeDump(yamlDumpData));
      setFieldTouched('yamlData', true);
    }
  }, [values.type, setFieldTouched, setFieldValue]);

  return (
    <FormSection title={title} flexLayout fullWidth>
      <YAMLEditorField name="yamlData" />
    </FormSection>
  );
};

export default YAMLEditorSection;
