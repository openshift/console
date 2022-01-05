import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import {
  ModalTitle,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
  createModalLauncher,
} from '@console/internal/components/factory/modal';
import ExportViewLogButton from './ExportViewLogButton';

export type ExportApplicationModalProps = ModalComponentProps & {
  namespace: string;
  startTime?: string;
  onCancelExport?: () => Promise<boolean>;
  onRestartExport?: () => Promise<boolean>;
};

export const ExportApplicationModal: React.FC<ExportApplicationModalProps> = (props) => {
  const { t } = useTranslation();
  const { cancel, namespace, startTime, onCancelExport, onRestartExport } = props;
  const [errMessage, setErrMessage] = React.useState<string>('');

  const onCancel = async () => {
    try {
      await onCancelExport();
      cancel();
    } catch (err) {
      setErrMessage(err.message);
    }
  };

  const onRestart = async () => {
    try {
      await onRestartExport();
      cancel();
    } catch (err) {
      setErrMessage(err.message);
    }
  };

  return (
    <div className="modal-content">
      <ModalTitle>{t('topology~Export Application')}</ModalTitle>
      <ModalBody>
        {startTime ? (
          <Trans t={t} ns="topology">
            Application export in <strong>{{ namespace }}</strong> is in progress. Started at{' '}
            {{ startTime }}.
          </Trans>
        ) : (
          <Trans t={t} ns="topology">
            Application export in <strong>{{ namespace }}</strong> is in progress.
          </Trans>
        )}
      </ModalBody>
      <ModalFooter inProgress={false} errorMessage={errMessage}>
        <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
          {onCancelExport && (
            <FlexItem>
              <Button
                type="button"
                variant="secondary"
                data-test="export-cancel-btn"
                onClick={onCancel}
              >
                {t('topology~Cancel Export')}
              </Button>
            </FlexItem>
          )}

          {onRestartExport && (
            <FlexItem>
              <Button
                type="button"
                variant="secondary"
                data-test="export-restart-btn"
                onClick={onRestart}
              >
                {t('topology~Restart Export')}
              </Button>
            </FlexItem>
          )}
          <FlexItem>
            <ExportViewLogButton namespace={namespace} onViewLog={cancel} />
          </FlexItem>
          <FlexItem>
            <Button type="button" variant="primary" data-test="export-close-btn" onClick={cancel}>
              {t('topology~OK')}
            </Button>
          </FlexItem>
        </Flex>
      </ModalFooter>
    </div>
  );
};

export default createModalLauncher<ExportApplicationModalProps>(ExportApplicationModal);
