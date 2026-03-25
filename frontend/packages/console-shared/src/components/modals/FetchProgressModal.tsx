import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Content,
  EmptyState,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  EmptyStateBody,
  EmptyStateStatus,
  AlertVariant,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { coFetch } from '@console/internal/co-fetch';
import { units } from '@console/internal/components/utils/units';
import { useToast } from '../toast';

export interface FetchProgressModalProps {
  /** URL to fetch */
  url: string;
  /** Title of the modal */
  title: ReactNode;
  /** Modal body text when downloading */
  downloadingText: ReactNode;
  /** Modal body text when download is complete (optional) */
  downloadedText: ReactNode;
  /** Modal body text when download fails (optional) */
  downloadFailedText: ReactNode;
  /** Whether the modal is open */
  isDownloading: boolean;
  /** Function to update the downloading state */
  setIsDownloading: (downloading: boolean) => void;
  /** Callback to receive the fetched data */
  callback: (data: ArrayBuffer) => void;
  /** Optional children to render in the modal body, placed after the status content */
  children?: ReactNode;
  /** Optional footer content, placed in the modal empty state footer */
  footer?: ReactNode;
  /** Maximum number of bytes to fetch (helps prevent browser OOM / tab hanging) */
  maxBytes?: number;
}

const getModalContainer = (): HTMLElement =>
  (document.fullscreenElement as HTMLElement) || document.body;

/**
 * Fetches a URL with download progress tracking. Displays a modal with the
 * current status and allows cancellation. On completion, the fetched data
 * is passed to the provided callback.
 */
export const FetchProgressModal: FC<FetchProgressModalProps> = ({
  url,
  title,
  downloadingText,
  downloadedText,
  downloadFailedText,
  isDownloading,
  setIsDownloading,
  callback,
  children,
  footer,
  maxBytes = 100 * 1024 * 1024, // 100 mb
}) => {
  const { t } = useTranslation('console-shared');

  const toaster = useToast();

  const [endState, setEndState] = useState<'complete' | 'failed' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [bytesDownloaded, setBytesDownloaded] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  const addToastRef = useRef(toaster.addToast);
  addToastRef.current = toaster.addToast;

  const urlRef = useRef(url);
  urlRef.current = url;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const maxBytesRef = useRef(maxBytes);
  maxBytesRef.current = maxBytes;

  const fetchData = useCallback(async () => {
    setBytesDownloaded(0);
    abortControllerRef.current = new AbortController();

    try {
      const response = await coFetch(urlRef.current, {
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      try {
        // Stream reading requires an indefinite loop that exits when done is true
        // eslint-disable-next-line no-constant-condition
        while (true) {
          // Sequential reads are required; each chunk depends on the previous read completing
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await reader.read();
          if (done) break;

          received += value.length;
          if (received > maxBytesRef.current) {
            throw new Error(
              t('The download exceeds the {{size}} processing limit.', {
                size: units.humanize(maxBytesRef.current, 'binaryBytes', true).string,
              }),
            );
          }
          chunks.push(value);
          setBytesDownloaded(received);
        }

        const arrayBuffer = new Uint8Array(received);
        let position = 0;
        for (const chunk of chunks) {
          arrayBuffer.set(chunk, position);
          position += chunk.length;
        }

        callbackRef.current(arrayBuffer.buffer);
        setEndState('complete');
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        addToastRef.current({
          variant: AlertVariant.info,
          title: t('Download canceled'),
          content: t('The download was canceled.'),
          timeout: true,
          dismissible: true,
        });
        setEndState(undefined);
        return;
      }
      // eslint-disable-next-line no-console
      console.error('Failed to fetch:', error);
      setErrorMessage(error?.message || t('Could not fetch data'));
      setEndState('failed');
    } finally {
      abortControllerRef.current = null;
      setIsDownloading(false);
    }
  }, [setIsDownloading, t]);

  useEffect(() => {
    if (isDownloading) {
      fetchData();
    }
  }, [isDownloading, fetchData]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsDownloading(false);
  }, [setIsDownloading]);

  const handleClose = useCallback(() => {
    handleCancel();
    setErrorMessage(null);
    setEndState(null);
    setBytesDownloaded(0);
  }, [handleCancel]);

  const emptyStateStatus = useMemo<EmptyStateStatus>(() => {
    switch (endState) {
      case 'failed':
        return EmptyStateStatus.danger;
      case 'complete':
        return EmptyStateStatus.success;
      default:
        return undefined;
    }
  }, [endState]);

  const bodyText = useMemo(() => {
    if (isDownloading) {
      return downloadingText;
    }
    if (endState === 'complete') {
      return downloadedText;
    }
    return downloadFailedText;
  }, [isDownloading, endState, downloadingText, downloadedText, downloadFailedText]);

  return (
    <Modal
      isOpen={isDownloading || !!endState}
      onClose={handleClose}
      variant="small"
      appendTo={getModalContainer}
    >
      <ModalHeader title={title} />
      <ModalBody>
        <EmptyState icon={isDownloading ? Spinner : undefined} status={emptyStateStatus}>
          <EmptyStateBody>
            <Content>{bodyText}</Content>
            <Content className="pf-v6-u-text-color-subtle">
              {endState === 'failed'
                ? errorMessage
                : t('Downloaded: {{size}}', {
                    size: units.humanize(bytesDownloaded, 'binaryBytes', true).string,
                  })}
            </Content>
          </EmptyStateBody>
          {footer && <EmptyStateFooter>{footer}</EmptyStateFooter>}
        </EmptyState>
        {children}
      </ModalBody>
      <ModalFooter>
        <Button
          key="cancel"
          data-test="fetch-progress-modal-cancel"
          variant="link"
          onClick={endState ? handleClose : handleCancel}
        >
          {endState ? t('console-shared~Close') : t('console-shared~Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
