import type { FC } from 'react';
import { useState, useCallback } from 'react';
import {
  Button,
  Checkbox,
  Content,
  ContentVariants,
  Form,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import { RH_OPERATOR_SUPPORT_POLICY_LINK } from '@console/shared';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';

export const OperatorHubCommunityProviderModal: FC<OperatorHubCommunityProviderModalProps> = ({
  close,
  cancel,
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
    <>
      <ModalHeader
        title={t('olm~Show community Operator')}
        titleIconVariant="info"
        data-test-id="modal-title"
      />
      <ModalBody>
        <Form id="community-provider-form" onSubmit={submit}>
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
                    text={t("olm~Learn more about Red Hat's third party software support policy")}
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
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          type="submit"
          variant="primary"
          form="community-provider-form"
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('olm~Continue')}
        </Button>
        <Button variant="link" onClick={cancel} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooter>
    </>
  );
};

export type OperatorHubCommunityProviderModalProps = {
  showCommunityOperators: (ignoreWarnings: boolean) => void;
} & ModalComponentProps;

export const CommunityOperatorWarningModalOverlay: OverlayComponent<OperatorHubCommunityProviderModalProps> = (
  props,
) => {
  return (
    <Modal variant={ModalVariant.small} isOpen onClose={props.closeOverlay}>
      <OperatorHubCommunityProviderModal
        {...props}
        close={props.closeOverlay}
        cancel={props.closeOverlay}
      />
    </Modal>
  );
};
