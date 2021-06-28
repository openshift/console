import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  FileUploadContext,
  FileUploadContextType,
} from '@console/app/src/components/file-upload/file-upload-context';
import { FileUploadField, InputField } from '@console/shared/src';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import FormSection from '../../section/FormSection';
import { getAppName } from '../../upload-jar-validation-utils';

const JarSection: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const {
    values: {
      name,
      fileUpload: { name: fileName, value: fileValue },
      application: { name: appGroupName, selectedKey: appGroupSelectedKey },
    },
    setFieldValue,
    setFieldTouched,
    touched,
  } = useFormikContext<FormikValues>();
  const { fileUpload, setFileUpload } = React.useContext<FileUploadContextType>(FileUploadContext);

  const { name: nameTouched } = touched;

  const updatedJarFile = React.useCallback(
    (value: File, filename: string): void => {
      if (filename) {
        const appName = getAppName(filename);
        setFieldValue('fileUpload.name', filename);
        setFieldTouched('fileUpload.name', true);
        value && setFieldValue('fileUpload.value', value);
        appName && !nameTouched && !name && setFieldValue('name', appName);
        !name && setFieldValue('name', appName);
        appName &&
          !appGroupName &&
          appGroupSelectedKey !== UNASSIGNED_KEY &&
          setFieldValue('application.name', `${appName}-app`);
      } else {
        setFieldValue('fileUpload.name', '');
        setFieldValue('fileUpload.value', '');
      }
    },
    [appGroupName, appGroupSelectedKey, setFieldValue, setFieldTouched, name, nameTouched],
  );

  React.useEffect(() => {
    if (fileUpload) {
      updatedJarFile(fileUpload, fileUpload.name);
      if (fileName) {
        setFileUpload(undefined);
      }
    }
  }, [fileUpload, updatedJarFile, setFileUpload, fileName]);

  return (
    <FormSection title={t('devconsole~JAR')}>
      <FileUploadField
        id="upload-jar-field"
        name="fileUpload.name"
        value={fileValue}
        filename={fileName}
        label={t('devconsole~JAR file')}
        filenamePlaceholder={t('devconsole~Drag a file here or browse to upload')}
        onChange={updatedJarFile}
        hideDefaultPreview
        dropzoneProps={{
          accept: '.jar,.JAR',
        }}
        required
      />
      <InputField
        type={TextInputTypes.text}
        name="fileUpload.javaArgs"
        label={t('devconsole~Optional Java commands')}
        helpText={t(
          'devconsole~Java commands are application specific and can be added to customize your application.',
        )}
        data-test-id="upload-jar-form-java-args"
        placeholder={t('devconsole~Enter Java commands here')}
      />
    </FormSection>
  );
};

export default JarSection;
