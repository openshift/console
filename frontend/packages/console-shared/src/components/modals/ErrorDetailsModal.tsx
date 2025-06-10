import * as React from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalVariant,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';
import { CopyToClipboard } from '@console/internal/components/utils/copy-to-clipboard';
import { getReportBugLink } from '@console/internal/module/k8s/cluster-settings';
import { ClusterVersionKind } from '@console/internal/module/k8s/types';
import { useClusterVersion } from '@console/shared/src/hooks/version';

export const ErrorDetailsBlock: React.FC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation('console-shared');
  return (
    <>
      <ModalHeader title={props.title} />
      <ModalBody>
        <div className="form-group">
          <label htmlFor="description">{t('Description:')}</label>
          <p>{props.errorMessage}</p>
        </div>
        <div className="form-group">
          <label htmlFor="componentTrace">{t('Component trace:')}</label>
          <div className="co-copy-to-clipboard__stacktrace-width-height">
            <CopyToClipboard value={props.componentStack.trim()} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="stackTrace">{t('Stack trace:')}</label>
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
  const { t } = useTranslation('console-shared');
  const [isOpen, setOpen] = React.useState(false);
  const clusterVersion: ClusterVersionKind = useClusterVersion();

  // destructure to undefined if we're not in a redux context
  const { label, href } = { ...getReportBugLink(clusterVersion) };

  return (
    <>
      <Button onClick={() => setOpen(true)} {...buttonProps}>
        {t('Show details')}
      </Button>
      <Modal variant={ModalVariant.large} isOpen={isOpen} onClose={() => setOpen(false)}>
        <ErrorDetailsBlock {...props} />
        <ModalFooter>
          <Button variant="primary" onClick={() => setOpen(false)}>
            {t('Close')}
          </Button>
          {label && href && (
            <Button
              variant="link"
              component="a"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              icon={<ExternalLinkAltIcon />}
              iconPosition="end"
            >
              {label}
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </>
  );
};
