import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { Checkbox, Content, ContentVariants, Icon, Split, SplitItem } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { RH_OPERATOR_SUPPORT_POLICY_LINK } from '@console/shared';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';

export const OperatorHubCommunityProviderModal: FC<OperatorHubCommunityProviderModalProps> = ({
  close,
  showCommunityOperators,
}) => {
  const { t } = useTranslation();
  const [ignoreWarnings, setIgnoreWarnings] = useState(false);
  const submit = useCallback(
    (event) => {
      event.preventDefault();
      close();
      showCommunityOperators(ignoreWarnings);
    },
    [close, ignoreWarnings, showCommunityOperators],
  );

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>{t('olm~Show community Operator')}</ModalTitle>
      <ModalBody>
        <Split hasGutter>
          <SplitItem>
            <Icon size="xl" status="info">
              <InfoCircleIcon />
            </Icon>
          </SplitItem>
          <SplitItem>
            <Content component={ContentVariants.p}>
              {t(
                'olm~Community Operators are Operators which have not been vetted or verified by Red Hat. Community Operators should be used with caution because their stability is unknown. Red Hat provides no support for community Operators.',
              )}
            </Content>
            {RH_OPERATOR_SUPPORT_POLICY_LINK && (
              <Content component={ContentVariants.p}>
                <ExternalLink
                  href={RH_OPERATOR_SUPPORT_POLICY_LINK}
                  text={t('olm~Learn more about Red Hat’s third party software support policy')}
                />
              </Content>
            )}
            <Checkbox
              className="co-modal-ignore-warning__checkbox"
              onChange={(_event, value) => setIgnoreWarnings(value)}
              isChecked={ignoreWarnings}
              data-checked-state={ignoreWarnings}
              id="do-not-show-warning"
              label={t('olm~Do not show this warning again')}
            />
          </SplitItem>
        </Split>
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('olm~Continue')}
        inProgress={false}
        errorMessage=""
        cancel={close}
      />
    </form>
  );
};

export type OperatorHubCommunityProviderModalProps = {
  showCommunityOperators: (ignoreWarnings: boolean) => void;
  close?: () => void;
};

export const communityOperatorWarningModal = createModalLauncher(OperatorHubCommunityProviderModal);
