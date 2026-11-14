import type { FC, ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalVariant,
  Switch,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';
import { CopyToClipboard } from '@console/internal/components/utils/copy-to-clipboard';
import { getReportBugLink } from '@console/internal/module/k8s/cluster-settings';
import type { ClusterVersionKind } from '@console/internal/module/k8s/types';
import { ExternalLinkButton } from '@console/shared/src/components/links/ExternalLinkButton';
import { useClusterVersion } from '@console/shared/src/hooks/useClusterVersion';
import { sourceMapResolver, symbolicateStack } from '@console/shared/src/utils/symbolicate-stack';

/** `trace` with bundle locations mapped to source files, or undefined until (or unless) that works. */
const useSymbolicated = (trace: string, nameFromCaller: boolean): string | undefined => {
  const [symbolicated, setSymbolicated] = useState<string>();
  useEffect(() => {
    let current = true;
    symbolicateStack(trace, sourceMapResolver, { nameFromCaller })
      .then((result) => current && result !== trace && setSymbolicated(result))
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [trace, nameFromCaller]);
  return symbolicated;
};

const ErrorDetailsBlock: FC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation('console-shared');
  const [showRaw, setShowRaw] = useState(false);
  const componentStack = props.componentStack.trim();
  const stack = props.stack.trim();
  const mappedComponentStack = useSymbolicated(componentStack, false);
  const mappedStack = useSymbolicated(stack, true);
  // Copy both, so a bug report has the source locations and what the browser printed.
  const withRaw = (mapped: string | undefined, raw: string) =>
    mapped ? `${mapped}\n\n${t('Raw trace:')}\n${raw}` : raw;
  const shown = (mapped: string | undefined, raw: string) => (showRaw ? raw : (mapped ?? raw));
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
            <CopyToClipboard
              id="component-trace"
              value={withRaw(mappedComponentStack, componentStack)}
              visibleValue={shown(mappedComponentStack, componentStack)}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="stackTrace">{t('Stack trace:')}</label>
          <div className="co-copy-to-clipboard__stacktrace-width-height">
            <CopyToClipboard
              id="stack-trace"
              value={withRaw(mappedStack, stack)}
              visibleValue={shown(mappedStack, stack)}
            />
          </div>
        </div>
        {(mappedComponentStack || mappedStack) && (
          <Switch
            id="error-details-show-raw"
            label={t('Show raw traces')}
            isChecked={showRaw}
            onChange={(_event, checked) => setShowRaw(checked)}
          />
        )}
      </ModalBody>
    </>
  );
};

type ErrorDetailsModalProps = ErrorBoundaryFallbackProps & {
  buttonProps?: Partial<ComponentProps<typeof Button>>;
};

export const ErrorDetailsModal: FC<ErrorDetailsModalProps> = ({ buttonProps, ...props }) => {
  const { t } = useTranslation('console-shared');
  const [isOpen, setOpen] = useState(false);
  const clusterVersion: ClusterVersionKind = useClusterVersion();

  // destructure to undefined if we're not in a redux context
  const { label, href } = { ...getReportBugLink(clusterVersion) };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        data-test="error-details-modal-show-details"
        {...buttonProps}
      >
        {t('Show details')}
      </Button>
      <Modal variant={ModalVariant.large} isOpen={isOpen} onClose={() => setOpen(false)}>
        <ErrorDetailsBlock {...props} />
        <ModalFooter>
          <Button variant="primary" onClick={() => setOpen(false)}>
            {t('Close')}
          </Button>
          {label && href && (
            <ExternalLinkButton variant="link" href={href}>
              {label}
            </ExternalLinkButton>
          )}
        </ModalFooter>
      </Modal>
    </>
  );
};
