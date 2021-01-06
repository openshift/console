import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, StackItem, Checkbox } from '@patternfly/react-core';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { ExternalLink } from '@console/internal/components/utils';

import { ModalFooter } from '../modal/modal-footer';
import { SUPPORT_URL } from '../../../constants';
import { BlueInfoCircleIcon } from '@console/shared';

type SupportModalProps = ModalComponentProps & {
  onConfirm: (disable: boolean) => void;
  communityURL?: string;
};

const SupportModal: React.FC<SupportModalProps> = ({ onConfirm, close, communityURL }) => {
  const { t } = useTranslation();
  const [doNotShow, setDoNotShow] = React.useState(false);
  return (
    <div className="modal-content">
      <ModalTitle>
        <BlueInfoCircleIcon className="co-icon-space-r" />
        {t('kubevirt-plugin~Template support')}
      </ModalTitle>
      <ModalBody>
        <Stack hasGutter>
          {communityURL ? (
            <>
              <StackItem>
                {t(
                  'kubevirt-plugin~Support for this template is provided by the OS community Red Hat participates in and contributes to.',
                )}
              </StackItem>
              <StackItem>
                <ExternalLink
                  href={communityURL}
                  text={t('kubevirt-plugin~Learn more about the community')}
                />
              </StackItem>
            </>
          ) : (
            <>
              <StackItem>
                {t('kubevirt-plugin~This template is not fully supported by Red Hat.')}
              </StackItem>
              <StackItem>
                <ExternalLink
                  href={SUPPORT_URL}
                  text={t("kubevirt-plugin~Learn more about Red Hat's third party support policy")}
                />
              </StackItem>
            </>
          )}
          <StackItem>
            <Checkbox
              id="support-warning"
              label={t('kubevirt-plugin~Do not show this warning again')}
              onChange={setDoNotShow}
              isChecked={doNotShow}
            />
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter
        submitButtonText={t('kubevirt-plugin~Continue')}
        onSubmit={() => {
          close();
          onConfirm(doNotShow);
        }}
        onCancel={close}
      />
    </div>
  );
};

export const createSupportModal = createModalLauncher(SupportModal);
