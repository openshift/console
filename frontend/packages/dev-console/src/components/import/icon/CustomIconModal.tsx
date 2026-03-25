import type { FC } from 'react';
import { useEffect, useState } from 'react';
import {
  Button,
  DropzoneErrorCode,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  InputGroup,
  InputGroupItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  MultipleFileUpload,
  MultipleFileUploadMain,
  TextInput,
  Tooltip,
  ValidatedOptions,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, TimesIcon, UploadIcon } from '@patternfly/react-icons';
import { t_global_font_line_height_body as pfLineHeight } from '@patternfly/react-tokens/dist/esm/t_global_font_line_height_body';
import { t_global_font_size_body_default as pfFontSize } from '@patternfly/react-tokens/dist/esm/t_global_font_size_body_default';
import { useTranslation } from 'react-i18next';
import { units } from '@console/internal/components/utils';

export type CustomIconModalProps = {
  isModalOpen: boolean;
  setModalOpen: (isOpen: boolean) => void;
  /**
   * The current URL of the custom icon.
   */
  customIcon: string;
  /**
   * Callback to update the icon URL in the parent component.
   * @param url The URL of the custom icon.
   */
  onCustomIconChanged: (url: string) => void;
};

/**
 * 262144 bytes is the maximum length of all annotations in one Kubernetes resource.
 *
 * We subtract 2 KiB as an arbitrary buffer to ensure other annotations can still be added.
 */
const MAX_ANNOTATION_LENGTH = 262144 - 2048;

/**
 * Maximum upload size for the custom icon.
 *
 * We compute the estimated decoded bytes from the maximum annotation length.
 *
 * We subtract an arbitrary 700 bytes to account for the data URL prefix.
 *
 * https://stackoverflow.com/a/17864767
 */
const MAX_UPLOAD_SIZE = Math.floor((3 * (MAX_ANNOTATION_LENGTH - 700)) / 4);

export const CustomIconModal: FC<CustomIconModalProps> = ({
  isModalOpen,
  setModalOpen,
  customIcon,
  onCustomIconChanged,
}) => {
  const { t } = useTranslation('devconsole');

  const [url, setUrl] = useState(customIcon);
  const [uploadError, setUploadError] = useState<DropzoneErrorCode | null>(null);

  const handleModalToggle = () => {
    setModalOpen(!isModalOpen);
  };

  // Sync state of custom icon whenever the modal opens
  useEffect(() => {
    if (isModalOpen) {
      setUrl(customIcon);
      setUploadError(null);
    }
  }, [isModalOpen, customIcon]);

  const validUrl = !url || (URL.canParse(url) && url.length < MAX_ANNOTATION_LENGTH);

  const getDraggedErrorMessage = (error: DropzoneErrorCode): string => {
    switch (error) {
      case DropzoneErrorCode.FileTooLarge:
        return t('File is too large. Maximum file size is {{ size }}.', {
          size: units.humanize(MAX_UPLOAD_SIZE, 'binaryBytes', true).string,
        });
      case DropzoneErrorCode.TooManyFiles:
        return t('Only one icon can be uploaded per resource.');
      case DropzoneErrorCode.FileInvalidType:
        return t(
          'Invalid file type. Supported formats are: .avif, .gif, .png, .apng, .svg, and .webp.',
        );
      default:
        return t('The file could not be uploaded. Try again.');
    }
  };

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isModalOpen}
      onClose={handleModalToggle}
      aria-labelledby="co-import-custom-icon-modal-title"
      aria-describedby="co-import-custom-icon-modal-description"
    >
      <ModalHeader
        title={t('Add custom icon')}
        description={t(
          'Set a custom icon to display in the Topology view. An annotation will be added to the resource defining the icon.',
        )}
        descriptorId="co-import-custom-icon-modal-description"
        labelId="co-import-custom-icon-modal-title"
      />
      <ModalBody>
        <Form id="co-import-custom-icon-modal-form">
          <MultipleFileUpload
            isHorizontal
            onFileDrop={(_, file) => {
              setUploadError(null);

              const reader = new FileReader();
              reader.onload = (e) => {
                setUrl(e.target?.result as string);
              };
              reader.readAsDataURL(file[0]);
            }}
            dropzoneProps={{
              maxFiles: 1,
              maxSize: MAX_UPLOAD_SIZE,
              onDropRejected: (rejections) => {
                setUploadError(rejections[0].errors[0].code as DropzoneErrorCode);
                setUrl('');
              },
              accept: {
                'image/avif': [],
                'image/gif': [],
                'image/png': [],
                'image/svg+xml': [],
                'image/webp': [],
              },
            }}
          >
            <MultipleFileUploadMain
              titleIcon={<UploadIcon />}
              titleText={t('Drag and drop an icon here')}
              titleTextSeparator={t('or')}
              browseButtonText={t('Upload')}
              infoText={t(
                'Maximum file size is {{ size }}. Supported formats are: .avif, .gif, .png, .apng, .svg, and .webp.',
                { size: units.humanize(MAX_UPLOAD_SIZE, 'binaryBytes', true).string },
              )}
            />
          </MultipleFileUpload>

          <FormGroup label={t('Icon URL')} fieldId="co-import-custom-icon-modal-url-input">
            <InputGroup>
              <InputGroupItem isFill>
                <TextInput
                  id="co-import-custom-icon-modal-url-input"
                  type="url"
                  data-test="import-custom-icon-url-input"
                  validated={uploadError || !validUrl ? ValidatedOptions.error : undefined}
                  value={url}
                  onChange={(_, value) => setUrl(value)}
                  placeholder={t('https://example.com/icon.png')}
                />
              </InputGroupItem>

              <InputGroupItem>
                <Tooltip content={t('Clear icon')}>
                  <Button
                    variant="control"
                    aria-label={t('Clear icon')}
                    onClick={() => {
                      setUrl('');
                      setUploadError(null);
                    }}
                    isDisabled={!url}
                  >
                    <TimesIcon />
                  </Button>
                </Tooltip>
              </InputGroupItem>
            </InputGroup>

            <FormHelperText
              style={{
                // make sure there is no layout shift when the error message appears
                height: `calc(${pfFontSize.var} * ${pfLineHeight.var})`,
              }}
            >
              {(uploadError || !validUrl) && (
                <HelperText>
                  <HelperTextItem variant={ValidatedOptions.error} icon={<ExclamationCircleIcon />}>
                    {validUrl && uploadError && getDraggedErrorMessage(uploadError)}
                    {!validUrl &&
                      t(
                        'Enter a valid URL for the icon. The URL must be less than {{ max }} characters.',
                        { max: MAX_ANNOTATION_LENGTH },
                      )}
                  </HelperTextItem>
                </HelperText>
              )}
            </FormHelperText>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="create"
          variant="primary"
          data-test="import-custom-icon-confirm"
          form="co-import-custom-icon-modal-form"
          onClick={() => {
            onCustomIconChanged(url);
            handleModalToggle();
          }}
        >
          {t('Save')}
        </Button>
        <Button key="cancel" variant="link" onClick={handleModalToggle}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
