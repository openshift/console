import * as React from 'react';
import { safeDump } from 'js-yaml';
import { YAMLEditorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { useFormikContext, FormikValues } from 'formik';
import {
  isDefaultChannel,
  getChannelKind,
  getCreateChannelData,
} from '../../../../utils/create-channel-utils';
import { AddChannelFormData } from '../../import-types';

const ChannelYamlEditor: React.FC = () => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const formData = React.useRef(values);
  if (formData.current.type !== values.type) {
    formData.current = values;
  }
  React.useEffect(() => {
    if (values.type && !isDefaultChannel(getChannelKind(values.type))) {
      setFieldValue(
        'yamlData',
        safeDump(getCreateChannelData(formData.current as AddChannelFormData)),
      );
      setFieldTouched('yamlData', true);
    }
  }, [values.type, setFieldTouched, setFieldValue]);

  return (
    <FormSection flexLayout fullWidth>
      <YAMLEditorField name="yamlData" />
    </FormSection>
  );
};

export default ChannelYamlEditor;
