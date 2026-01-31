import type { FC, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import {
  Alert,
  FileUpload,
  FileUploadProps,
  DropzoneErrorCode,
  TextArea,
  FormHelperText,
  HelperText,
  HelperTextItem,
  FileUploadHelperText,
  Spinner,
  spinnerSize,
  FormGroup,
} from '@patternfly/react-core';
import { isBinary } from 'istextorbinary';
import { useTranslation } from 'react-i18next';
import { units } from './units';
import styles from '@patternfly/react-styles/css/components/FileUpload/file-upload';

/** Maximal file size, in bytes, that user can upload */
const MAX_UPLOAD_SIZE = 4000000;

export interface DroppableFileInputProps {
  /** The content of the input file, either as a UTF-8 string or a base64-encoded string if the file is binary */
  inputFileData: string;
  /** Callback function invoked when the file content changes */
  onChange: (inputFileData: string, inputFileIsBinary: boolean) => void;
  /** Label for the file input field */
  label: ReactNode;
  /** Unique id for the file input field */
  id: string;
  /** Placeholder text for the filename field */
  filenamePlaceholder: string;
  /** Help text for the textarea field */
  textareaFieldHelpText?: ReactNode;
  /** Whether the field is required */
  isRequired?: boolean;
  /** Error message to display below the preview */
  errorMessage?: string;
}

export const DroppableFileInput: FC<DroppableFileInputProps> = ({
  inputFileData,
  onChange,
  label,
  id,
  filenamePlaceholder,
  textareaFieldHelpText,
  isRequired,
  errorMessage,
}) => {
  const [filename, setFilename] = useState<string>('');
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string>('');
  const [inputFileIsBinary, setInputFileIsBinary] = useState<boolean>(
    isBinary(filename, Buffer.from(inputFileData)),
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const hasError = !!errorMessage || !!uploadErrorMessage;

  const { t } = useTranslation('public');

  const handleFileInputChange = useCallback<FileUploadProps['onFileInputChange']>(
    (_, file: File) => {
      setIsLoading(true);
      setUploadErrorMessage('');
      setFilename(file.name);

      const reader = new FileReader();
      reader.onload = () => {
        const buffer = Buffer.from(reader.result as ArrayBuffer);
        const fileIsBinary = isBinary(file.name, buffer);
        setInputFileIsBinary(fileIsBinary);
        onChange(buffer.toString(fileIsBinary ? 'base64' : 'utf-8'), fileIsBinary);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setUploadErrorMessage(t('An error occurred while reading the file.'));
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    },
    [onChange, t],
  );

  const handleFileRejected = useCallback<FileUploadProps['dropzoneProps']['onDropRejected']>(
    (rejections) => {
      const code = rejections[0].errors[0].code;

      switch (code) {
        case DropzoneErrorCode.FileTooLarge:
          setUploadErrorMessage(
            t('File is too large. Maximum file size is {{ size }}.', {
              size: units.humanize(MAX_UPLOAD_SIZE, 'binaryBytes', true).string,
            }),
          );
          break;
        case DropzoneErrorCode.TooManyFiles:
          setUploadErrorMessage(t('Too many files. Maximum one file can be uploaded.'));
          break;
        default:
          setUploadErrorMessage(t('An error occurred while uploading the file.'));
      }

      setFilename('');
      onChange('', false);
    },
    [onChange, t],
  );

  const handleClear = useCallback<FileUploadProps['onClearClick']>(() => {
    setFilename('');
    setInputFileIsBinary(false);
    onChange('', false);
    setUploadErrorMessage('');
  }, [onChange]);

  return (
    <FormGroup label={label} isRequired={isRequired} fieldId={id}>
      <FileUpload
        className="co-file-input pf-v6-u-mb-md"
        id={id}
        type="text"
        value={inputFileData}
        filename={filename}
        filenamePlaceholder={filenamePlaceholder}
        filenameAriaLabel={t('{{label}} filename', { label })} // Make the 'aria-label' unique since 'input' and 'textarea' fields share the same 'id'.
        browseButtonAriaDescribedby={textareaFieldHelpText ? `${id}-help` : undefined}
        onFileInputChange={handleFileInputChange}
        onClearClick={handleClear}
        isRequired={isRequired}
        hideDefaultPreview
        browseButtonText={t('Browse...')}
        clearButtonText={t('Clear')}
        dropzoneProps={{
          maxSize: MAX_UPLOAD_SIZE,
          onDropRejected: handleFileRejected,
        }}
        validated={uploadErrorMessage ? 'error' : 'default'}
      >
        {!isLoading && inputFileIsBinary && (
          <Alert
            isInline
            className="co-alert"
            variant="info"
            title={t('Non-printable file detected.')}
            data-test="file-input-binary-alert"
          >
            {t('File contains non-printable characters. Preview is not available.')}
          </Alert>
        )}

        {!inputFileIsBinary && (
          <div className={styles.fileUploadFileDetails}>
            <TextArea
              data-test-id="file-input-textarea"
              className="co-file-dropzone__textarea"
              readOnly={isLoading}
              resizeOrientation="vertical"
              data-test={`${id}-textarea`}
              onChange={(e) => {
                const fileContent = e.target.value;
                onChange(fileContent, false);
              }}
              value={inputFileData}
              aria-label={t('{{label}}', { label })}
              aria-describedby={textareaFieldHelpText ? `${id}-textarea-help` : undefined}
              required={isRequired}
              validated={hasError ? 'error' : 'default'}
            />
            {isLoading && (
              <div className={styles.fileUploadFileDetailsSpinner}>
                <Spinner size={spinnerSize.lg} />
              </div>
            )}
          </div>
        )}

        {textareaFieldHelpText || hasError ? (
          <FileUploadHelperText id={`${id}-textarea-help`}>
            {textareaFieldHelpText ? (
              <HelperText id={`${id}-help`}>
                <HelperTextItem>{textareaFieldHelpText}</HelperTextItem>
              </HelperText>
            ) : null}
            {errorMessage ? (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
                </HelperText>
              </FormHelperText>
            ) : null}
            {uploadErrorMessage ? (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">{uploadErrorMessage}</HelperTextItem>
                </HelperText>
              </FormHelperText>
            ) : null}
          </FileUploadHelperText>
        ) : null}
      </FileUpload>
    </FormGroup>
  );
};
