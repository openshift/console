import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, StackItem, Checkbox, Label } from '@patternfly/react-core';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { ExternalLink } from '@console/internal/components/utils';
import { BlueInfoCircleIcon } from '@console/shared';

import { ModalFooter } from '../modal/modal-footer';
import { TEMPLATE_PROVIDER_ANNOTATION, TEMPLATE_SUPPORT_LEVEL } from '../../../constants';
import { TemplateSupport } from '../../../constants/vm-templates/support';

import './support-modal.scss';

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
                  'kubevirt-plugin~Support for this template is provided through the OS community Red Hat participates in and contributes to.',
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
                {t(
                  'kubevirt-plugin~The support level is not defined in the template yaml. To mark this template as supported, add these two annotations in the template details:',
                )}
              </StackItem>
              <StackItem>
                <Label className="kv-support-label">
                  {TEMPLATE_PROVIDER_ANNOTATION}: Your company name
                </Label>
                <Label>
                  {TEMPLATE_SUPPORT_LEVEL}: {TemplateSupport.FULL_SUPPORT.getValue()}
                </Label>
              </StackItem>
            </>
          )}
          <StackItem>
            <Checkbox
              id="support-warning"
              label={t('kubevirt-plugin~Do not show this message again')}
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
