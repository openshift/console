import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { ExternalLink } from '@console/internal/components/utils';
import { BlueInfoCircleIcon } from '@console/shared';
import { Checkbox, Label, Stack, StackItem } from '@patternfly/react-core';

import { TEMPLATE_PROVIDER_ANNOTATION, TEMPLATE_SUPPORT_LEVEL } from '../../../constants';
import { TemplateSupport } from '../../../constants/vm-templates/support';
import { SUPPORT_URL } from '../../../constants/vm-templates/constants';
import { ModalFooter } from '../modal/modal-footer';

import './support-modal.scss';

type SupportModalProps = ModalComponentProps & {
  onConfirm: (disable: boolean) => void;
  communityURL?: string;
  isCommonTemplate?: boolean;
};

const SupportModal: React.FC<SupportModalProps> = ({
  onConfirm,
  close,
  communityURL,
  isCommonTemplate,
}) => {
  const { t } = useTranslation();
  const [doNotShow, setDoNotShow] = React.useState(false);
  return (
    <div className="modal-content" data-test="SupportModal">
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
          ) : isCommonTemplate ? (
            <>
              <StackItem>
                {t('kubevirt-plugin~This template is provided by Red Hat, but is not supported')}{' '}
                <ExternalLink href={SUPPORT_URL} text={t('kubevirt-plugin~Learn more')} />
              </StackItem>
            </>
          ) : (
            <>
              <StackItem data-test="no-support-description">
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
