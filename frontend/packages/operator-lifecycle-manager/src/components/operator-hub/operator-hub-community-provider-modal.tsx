import * as React from 'react';
import { Checkbox } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { ExternalLink } from '@console/internal/components/utils';
import { RH_OPERATOR_SUPPORT_POLICY_LINK } from '@console/shared';

export const OperatorHubCommunityProviderModal: React.FC<OperatorHubCommunityProviderModalProps> = ({
  close,
  showCommunityOperators,
}) => {
  const { t } = useTranslation();
  const [ignoreWarnings, setIgnoreWarnings] = React.useState(false);
  const submit = React.useCallback(
    (event) => {
      event.preventDefault();
      close();
      showCommunityOperators(ignoreWarnings);
    },
    [close, ignoreWarnings, showCommunityOperators],
  );

  return (
    <form onSubmit={submit} className="modal-content co-modal-ignore-warning">
      <ModalTitle>{t('olm~Show community Operator')}</ModalTitle>
      <ModalBody>
        <div className="co-modal-ignore-warning__content">
          <div className="co-modal-ignore-warning__icon">
            <InfoCircleIcon />
          </div>
          <div>
            <p>
              {t(
                'olm~Community Operators are Operators which have not been vetted or verified by Red Hat. Community Operators should be used with caution because their stability is unknown. Red Hat provides no support for community Operators.',
              )}
              {RH_OPERATOR_SUPPORT_POLICY_LINK && (
                <span className="co-modal-ignore-warning__link">
                  <ExternalLink
                    href={RH_OPERATOR_SUPPORT_POLICY_LINK}
                    text={t('olm~Learn more about Red Hat’s third party software support policy')}
                  />
                </span>
              )}
            </p>
            <Checkbox
              className="co-modal-ignore-warning__checkbox"
              onChange={setIgnoreWarnings}
              isChecked={ignoreWarnings}
              id="do-not-show-warning"
              label={t('olm~Do not show this warning again')}
            />
          </div>
        </div>
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
