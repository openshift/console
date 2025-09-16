import { ActionGroup, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalComponentProps,
} from '../factory/modal';
import { YellowExclamationTriangleIcon } from '@console/shared';

export const ModalErrorContent = (props: ErrorModalProps) => {
  const { t } = useTranslation();
  const { error, title, cancel } = props;
  const titleText = title || t('public~Error');
  return (
    <div className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {titleText}
      </ModalTitle>
      <ModalBody>{error}</ModalBody>
      <ModalFooter inProgress={false} errorMessage="">
        <ActionGroup className="pf-v6-c-form pf-v6-c-form__actions--right pf-v6-c-form__group--no-top-margin">
          <Button type="button" variant="primary" onClick={cancel}>
            {t('public~OK')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </div>
  );
};

export const errorModal = createModalLauncher(ModalErrorContent);

export type ErrorModalProps = {
  error: string;
  title?: string;
} & ModalComponentProps;
