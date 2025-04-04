import * as React from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';
import { CopyToClipboard } from '@console/internal/components/utils/copy-to-clipboard';

export const ErrorDetailsBlock: React.FC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <ModalHeader title={props.title} />
      <ModalBody>
        <div className="form-group">
          <label htmlFor="description">{t('console-shared~Description:')}</label>
          <p>{props.errorMessage}</p>
        </div>
        <div className="form-group">
          <label htmlFor="componentTrace">{t('console-shared~Component trace:')}</label>
          <div className="co-copy-to-clipboard__stacktrace-width-height">
            <CopyToClipboard value={props.componentStack.trim()} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="stackTrace">{t('console-shared~Stack trace:')}</label>
          <div className="co-copy-to-clipboard__stacktrace-width-height">
            <CopyToClipboard value={props.stack.trim()} />
          </div>
        </div>
      </ModalBody>
    </>
  );
};

type ErrorDetailsModalProps = ErrorBoundaryFallbackProps & {
  buttonProps?: Partial<React.ComponentProps<typeof Button>>;
};

export const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({ buttonProps, ...props }) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} {...buttonProps}>
        {t('console-shared~Show details')}
      </Button>
      <Modal
        variant={ModalVariant.large}
        title={t('console-shared~Something wrong happened')}
        isOpen={isOpen}
        onClose={() => setOpen(false)}
      >
        <ErrorDetailsBlock {...props} />
        <ModalFooter>
          <Button variant="primary" onClick={() => setOpen(false)}>
            {t('console-shared~Close')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
