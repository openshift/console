import * as React from 'react';
import { Alert, Button, Modal, ModalVariant, Split, SplitItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';
import ErrorDetailsBlock from './ErrorDetailsBlock';

/**
 * Support for error boundary content that won't consume the whole page.
 */
const ErrorBoundaryFallbackInline: React.FC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(false);
  return (
    <>
      <Split hasGutter>
        <SplitItem>
          <Alert variant="danger" isInline isPlain title={t('console-shared~Extension error')} />
        </SplitItem>
        <SplitItem>
          <Button variant="link" isInline onClick={() => setOpen(true)}>
            {t('console-shared~Show details')}
          </Button>
        </SplitItem>
      </Split>
      <Modal
        variant={ModalVariant.large}
        title={t('console-shared~Oh no! Something went wrong.')}
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        actions={[
          <Button key="confirm" variant="primary" onClick={() => setOpen(false)}>
            {t('console-shared~Close')}
          </Button>,
        ]}
      >
        <ErrorDetailsBlock {...props} />
      </Modal>
    </>
  );
};

export default ErrorBoundaryFallbackInline;
