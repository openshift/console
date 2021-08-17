import * as React from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import {
  ModalTitle,
  ModalBody,
  ModalComponentProps,
  createModalLauncher,
  ModalFooter,
} from '@console/internal/components/factory/modal';

type ExportApplicationModalProps = ModalComponentProps & {
  namespace: string;
  startTime?: string;
};

const ExportApplicationModal: React.FC<ExportApplicationModalProps> = (props) => {
  const { t } = useTranslation();
  const { cancel, namespace, startTime } = props;
  return (
    <form className="modal-content" onSubmit={cancel}>
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
      <ModalFooter inProgress={false}>
        <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
          <Button type="button" variant="secondary" onClick={cancel}>
            {t('topology~OK')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </form>
  );
};

export default createModalLauncher<ExportApplicationModalProps>(ExportApplicationModal);
