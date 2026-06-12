import type { FC } from 'react';
import { useContext, useCallback, useEffect } from 'react';
import type { DropEvent } from '@patternfly/react-core';
import { FileUpload, TextInputTypes } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import type { FileUploadContextType } from '@console/app/src/components/file-upload/file-upload-context';
import { FileUploadContext } from '@console/app/src/components/file-upload/file-upload-context';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import FormSection from '../../section/FormSection';
import { getAppName } from '../../upload-jar-validation-utils';

const JarSection: FC = () => {
  const { t } = useTranslation('devconsole');
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
  const { fileUpload, setFileUpload } = useContext<FileUploadContextType>(FileUploadContext);

  const { name: nameTouched } = touched;

  const updatedJarFile = useCallback(
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

  useEffect(() => {
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
    <FormSection title={t('JAR')}>
      <FileUpload
        id="upload-jar-field"
        name="fileUpload.name"
        value={fileValue}
        filename={fileName}
        filenameAriaLabel={t('JAR file')}
        filenamePlaceholder={t('Drag a file here or browse to upload')}
        browseButtonText={t('Browse...')}
        clearButtonText={t('Clear')}
        onFileInputChange={updatedJarFile}
        hideDefaultPreview
        dropzoneProps={{
          accept: { 'application/java-archive': ['.jar', '.JAR'] },
        }}
        isRequired
        onClearClick={handleClear}
        className="pf-v6-u-p-0"
      />
      <InputField
        type={TextInputTypes.text}
        name="fileUpload.javaArgs"
        label={t('Optional Java arguments')}
        helpText={t(
          'Optional Java arguments are saved as JAVA_ARGS environment variable to customize your application.',
        )}
        data-test-id="upload-jar-form-java-args"
        placeholder={t('JAVA_ARGS')}
      />
    </FormSection>
  );
};

export default JarSection;
