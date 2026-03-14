import type { FormEventHandler } from 'react';
import { useState, useRef, useCallback } from 'react';
import {
  Button,
  Content,
  ContentVariants,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Radio,
  TextInput,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import { ClusterVersionModel } from '../../models';
import { ClusterVersionKind, k8sPatch } from '../../module/k8s';
import { ModalComponentProps } from '../factory/modal';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import {
  documentationURLs,
  getDocumentationURL,
  isManaged,
  isUpstream,
} from '../utils/documentation';
import { useTranslation } from 'react-i18next';
import { CLUSTER_VERSION_DEFAULT_UPSTREAM_SERVER_URL_PLACEHOLDER } from '@console/shared/src/constants';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';

export const ConfigureClusterUpstreamModal = (props: ConfigureClusterUpstreamModalProps) => {
  const { cv, close } = props;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const currentUpstream = cv?.spec?.upstream;

  const [customSelected, setCustomSelected] = useState(!!currentUpstream);
  const [customURL, setCustomURL] = useState(currentUpstream ?? '');
  const customURLInputRef = useRef(null);
  const [invalidCustomURL, setInvalidCustomURL] = useState(false);

  const submit: FormEventHandler<HTMLFormElement> = useCallback(
    (e): void => {
      e.preventDefault();
      if (customSelected) {
        if (!customURL) {
          setInvalidCustomURL(true);
          return;
        } else if (customURL === currentUpstream) {
          close();
          return;
        }
      } else if (!currentUpstream) {
        close();
        return;
      }
      const value = customSelected ? customURL : null;
      const patch = [{ op: 'add', path: '/spec/upstream', value }];
      handlePromise(k8sPatch(ClusterVersionModel, cv, patch))
        .then(() => close())
        .catch(() => {});
    },
    [customSelected, customURL, currentUpstream, cv, handlePromise, close],
  );
  const { t } = useTranslation();

  const updateURL = getDocumentationURL(documentationURLs.updateService);

  return (
    <>
      <ModalHeader
        title={t('public~Edit upstream configuration')}
        data-test-id="modal-title"
        labelId="configure-cluster-upstream-modal-title"
      />
      <ModalBody>
        <Content component={ContentVariants.p}>
          {t(
            'public~Select a configuration to receive updates. Updates can be configured to receive information from Red Hat or a custom update service.',
          )}
        </Content>
        {!isManaged() && !isUpstream() && (
          <Content component={ContentVariants.p}>
            <ExternalLink
              href={updateURL}
              text={t('public~Learn more about OpenShift local update services.')}
            />
          </Content>
        )}
        <Form id="configure-cluster-upstream-form" onSubmit={submit}>
          <FormGroup
            label={t('public~Configuration')}
            role="radiogroup"
            fieldId="co-add-secret-to-workload"
            isStack
          >
            <Radio
              name="config-default"
              id="config-default"
              onChange={() => {
                setCustomSelected(false);
                setInvalidCustomURL(false);
              }}
              label={t('public~Default')}
              isChecked={!customSelected}
              body={
                !customSelected && (
                  <>
                    <TextInput
                      id={'cluster-version-default-upstream-server-url'}
                      type="url"
                      readOnly
                      value={CLUSTER_VERSION_DEFAULT_UPSTREAM_SERVER_URL_PLACEHOLDER}
                      readOnlyVariant="default"
                    />
                    <FormHelperText className="pf-v6-u-mt-sm">
                      <HelperText>
                        <HelperTextItem>
                          {t('public~Receive update information from Red Hat.')}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </>
                )
              }
            />
            <Radio
              name="config-custom"
              id="config-custom"
              onChange={() => {
                setCustomSelected(true);
                setTimeout(() => {
                  customURLInputRef.current?.focus();
                }, 0);
              }}
              label={t('public~Custom update service')}
              isChecked={customSelected}
              body={
                customSelected && (
                  <>
                    <TextInput
                      id="cluster-version-custom-upstream-server-url"
                      type="url"
                      placeholder="https://example.com/api/upgrades_info/v1/graph"
                      value={customURL}
                      onChange={(_event, text) => {
                        setCustomSelected(true);
                        setCustomURL(text);
                        setInvalidCustomURL(false);
                      }}
                      validated={invalidCustomURL ? 'error' : 'default'}
                      ref={customURLInputRef}
                    />
                    {invalidCustomURL && (
                      <FormHelperText className="pf-v6-u-mt-sm">
                        <HelperText>
                          <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
                            {t('public~Please enter a URL.')}
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    )}
                  </>
                )
              }
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          isLoading={inProgress}
          isDisabled={inProgress || invalidCustomURL}
          data-test="confirm-action"
          form="configure-cluster-upstream-form"
        >
          {t('public~Save')}
        </Button>
        <Button variant="link" onClick={props.cancel} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const ConfigureClusterUpstreamModalOverlay: OverlayComponent<ConfigureClusterUpstreamModalProps> = (
  props,
) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={handleClose}
      aria-labelledby="configure-cluster-upstream-modal-title"
    >
      <ConfigureClusterUpstreamModal {...props} cancel={handleClose} close={handleClose} />
    </Modal>
  ) : null;
};

export type ConfigureClusterUpstreamModalProps = {
  cv: ClusterVersionKind;
} & ModalComponentProps;
