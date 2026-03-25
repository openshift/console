import type { FC } from 'react';
import { ActionGroup, Alert, Button, ButtonVariant } from '@patternfly/react-core';
import { DownloadIcon } from '@patternfly/react-icons/dist/esm/icons/download-icon';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { ButtonBar } from '@console/internal/components/utils/button-bar';
import { useScrollContainer } from '../../hooks/useScrollContainer';
import { Shadows, useScrollShadows } from '../../hooks/useScrollShadows';
import type { FormFooterProps } from './form-utils-types';

import './FormFooter.scss';

const FormFooter: FC<FormFooterProps> = ({
  handleSubmit,
  handleReset,
  handleCancel,
  handleDownload,
  submitLabel,
  resetLabel,
  cancelLabel,
  infoTitle,
  infoMessage,
  isSubmitting,
  errorMessage,
  successMessage,
  disableSubmit,
  hideSubmit = false,
  showAlert,
  sticky,
}) => {
  const { t } = useTranslation();
  const [scrollContainer, footerElementRef] = useScrollContainer();
  const shadowPosition = useScrollShadows(sticky ? scrollContainer : null);
  return (
    <div
      className={css('ocs-form-footer', {
        'ocs-form-footer__sticky': sticky,
        'ocs-form-footer__shadow':
          sticky && (shadowPosition === Shadows.both || shadowPosition === Shadows.bottom),
      })}
      data-test="form-footer"
      ref={footerElementRef}
    >
      <ButtonBar
        inProgress={isSubmitting && hideSubmit}
        errorMessage={errorMessage}
        successMessage={successMessage}
      >
        {showAlert && (
          <Alert
            isInline
            className="co-alert"
            variant="info"
            title={infoTitle || t('console-shared~You made changes to this page.')}
          >
            {infoMessage ||
              t('console-shared~Click {{submit}} to save changes or {{reset}} to cancel changes.', {
                submit: submitLabel,
                reset: resetLabel,
              })}
          </Alert>
        )}
        <ActionGroup className="pf-v6-c-form pf-v6-c-form__group--no-top-margin">
          {!hideSubmit && (
            <Button
              type={handleSubmit ? 'button' : 'submit'}
              {...(handleSubmit && { onClick: handleSubmit })}
              variant={ButtonVariant.primary}
              isDisabled={disableSubmit}
              isLoading={isSubmitting}
              data-test-id="submit-button"
              data-test="save-changes"
            >
              {submitLabel || t('console-shared~Save')}
            </Button>
          )}
          {handleReset && (
            <Button
              type="button"
              data-test-id="reset-button"
              variant={ButtonVariant.secondary}
              onClick={handleReset}
            >
              {resetLabel || t('console-shared~Reload')}
            </Button>
          )}
          {handleCancel && (
            <Button
              type="button"
              data-test-id="cancel-button"
              variant={ButtonVariant.secondary}
              onClick={handleCancel}
            >
              {cancelLabel || t('console-shared~Cancel')}
            </Button>
          )}
          {handleDownload && (
            <Button
              type="button"
              data-test-id="download-button"
              variant={ButtonVariant.secondary}
              className="pf-v6-c-button--align-right pf-v6-u-display-none pf-v6-u-display-flex-on-sm"
              onClick={handleDownload}
              icon={<DownloadIcon />}
            >
              {t('console-shared~Download')}
            </Button>
          )}
        </ActionGroup>
      </ButtonBar>
    </div>
  );
};
export default FormFooter;
