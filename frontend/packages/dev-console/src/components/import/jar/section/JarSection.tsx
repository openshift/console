import * as React from 'react';
import { DropEvent, FileUpload, TextInputTypes } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  FileUploadContext,
  FileUploadContextType,
} from '@console/app/src/components/file-upload/file-upload-context';
import { InputField } from '@console/shared/src';
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
    (_event: DropEvent, file: File): void => {
      if (file.name) {
        const appName = getAppName(file.name);
        setFieldValue('fileUpload.name', file.name);
        setFieldTouched('fileUpload.name', true);
        file && setFieldValue('fileUpload.value', file);
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
      updatedJarFile(null, fileUpload);
      if (fileName) {
        setFileUpload(undefined);
      }
    }
  }, [fileUpload, updatedJarFile, setFileUpload, fileName]);

  const handleClear = () => {
    setFieldValue('fileUpload.value', '');
    setFieldValue('fileUpload.name', '');
    setTimeout(() => {
      setFieldTouched('fileUpload.name', true);
    }, 0);
  };

  return (
    <FormSection title={t('devconsole~JAR')}>
      <FileUpload
        id="upload-jar-field"
        name="fileUpload.name"
        value={fileValue}
        filename={fileName}
        label={t('devconsole~JAR file')}
        filenamePlaceholder={t('devconsole~Drag a file here or browse to upload')}
        browseButtonText={t('devconsole~Browse...')}
        clearButtonText={t('devconsole~Clear')}
        onFileInputChange={updatedJarFile}
        hideDefaultPreview
        dropzoneProps={{
          accept: { 'application/java-archive': ['.jar', '.JAR'] },
        }}
        isRequired
        onClearClick={handleClear}
      />
      <InputField
        type={TextInputTypes.text}
        name="fileUpload.javaArgs"
        label={t('devconsole~Optional Java arguments')}
        helpText={t(
          'devconsole~Optional Java arguments are saved as JAVA_ARGS environment variable to customize your application.',
        )}
        data-test-id="upload-jar-form-java-args"
        placeholder={t('devconsole~JAVA_ARGS')}
      />
    </FormSection>
  );
};

export default JarSection;
