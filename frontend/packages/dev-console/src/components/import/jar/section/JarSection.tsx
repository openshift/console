import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { FormGroup, TextInputTypes } from '@patternfly/react-core';
import { FileUploadField, InputField } from '@console/shared/src';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import FormSection from '../../section/FormSection';

const JarSection: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const {
    values: {
      fileUpload: { name: fileName, value: fileValue },
      application: { name: appGroupName, selectedKey: appGroupSelectedKey },
    },
    setFieldValue,
    setFieldTouched,
  } = useFormikContext<FormikValues>();
  const updatedJarFile = (value: File, filename: string) => {
    if (filename) {
      const appName = filename.split('.')[0];
      setFieldValue('fileUpload.name', filename);
      setFieldTouched('fileUpload.name', true);
      setFieldValue('fileUpload.value', value);
      setFieldValue('name', appName);
      !appGroupName &&
        appGroupSelectedKey !== UNASSIGNED_KEY &&
        setFieldValue('application.name', `${appName}-app`);
    } else {
      setFieldValue('fileUpload.name', '');
      setFieldValue('fileUpload.value', '');
    }
  };
  return (
    <FormSection title={t('devconsole~JAR')}>
      <FileUploadField
        name="fileUpload.name"
        value={fileValue}
        filename={fileName}
        label={t('devconsole~JAR file')}
        filenamePlaceholder={t('devconsole~Drag a file here or browse to upload')}
        onChange={updatedJarFile}
        hideDefaultPreview
        dropzoneProps={{
          accept: '.jar',
        }}
        required
      />
      <FormGroup fieldId="uploadJarSection" label={t('devconsole~Optional Java commands')}>
        <InputField
          type={TextInputTypes.text}
          name="fileUpload.javaArgs"
          helpText={t(
            'devconsole~Java commands are Application specific and can be added to customize your Application.',
          )}
          data-test-id="upload-jar-form-java-args"
          placeholder={t('devconsole~Enter Java command here')}
        />
      </FormGroup>
    </FormSection>
  );
};

export default JarSection;
