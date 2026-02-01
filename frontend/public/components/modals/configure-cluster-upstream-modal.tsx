import type { FormEventHandler } from 'react';
import { useState, useRef, useCallback } from 'react';
import {
  Form,
  FormHelperText,
  FormSection,
  HelperText,
  HelperTextItem,
  Radio,
  Stack,
  StackItem,
  TextInput,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import { ClusterVersionModel } from '../../models';
import { ClusterVersionKind, k8sPatch } from '../../module/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  ModalWrapper,
} from '../factory/modal';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import {
  documentationURLs,
  getDocumentationURL,
  isManaged,
  isUpstream,
} from '../utils/documentation';
import { useTranslation } from 'react-i18next';
import { CLUSTER_VERSION_DEFAULT_UPSTREAM_SERVER_URL_PLACEHOLDER } from '@console/shared/src/constants';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

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
      <ModalTitle>{t('public~Edit upstream configuration')}</ModalTitle>
      <Form onSubmit={submit} name="form" className="pf-v6-c-form--no-gap">
        <ModalBody>
          <p>
            {t(
              'public~Select a configuration to receive updates. Updates can be configured to receive information from Red Hat or a custom update service.',
            )}
          </p>
          {!isManaged() && !isUpstream() && (
            <p>
              <ExternalLink
                href={updateURL}
                text={t('public~Learn more about OpenShift local update services.')}
              />
            </p>
          )}
          <FormSection title={t('public~Configuration')}>
            <Stack hasGutter>
              <StackItem>
                <Radio
                  name="config-default"
                  id="config-default"
                  onChange={() => {
                    setCustomSelected(false);
                    setInvalidCustomURL(false);
                  }}
                  label={t('public~Default')}
                  isChecked={!customSelected}
                />
                <TextInput
                  id={'cluster-version-default-upstream-server-url'}
                  type="url"
                  readOnly
                  value={CLUSTER_VERSION_DEFAULT_UPSTREAM_SERVER_URL_PLACEHOLDER}
                  readOnlyVariant="default"
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      {t('public~Receive update information from Red Hat.')}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </StackItem>
              <StackItem>
                <Radio
                  name="config-custom"
                  id="config-custom"
                  onChange={() => {
                    setCustomSelected(true);
                    customURLInputRef.current.focus();
                  }}
                  label={t('public~Custom update service')}
                  isChecked={customSelected}
                />
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
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
                        {t('public~Please enter a URL.')}
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                )}
              </StackItem>
            </Stack>
          </FormSection>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          inProgress={inProgress}
          submitText={t('public~Save')}
          cancel={props.cancel}
          submitDisabled={invalidCustomURL}
        />
      </Form>
    </>
  );
};

export const ConfigureClusterUpstreamModalOverlay: OverlayComponent<ConfigureClusterUpstreamModalProps> = (
  props,
) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <ConfigureClusterUpstreamModal
        {...props}
        cancel={props.closeOverlay}
        close={props.closeOverlay}
      />
    </ModalWrapper>
  );
};

export type ConfigureClusterUpstreamModalProps = {
  cv: ClusterVersionKind;
} & ModalComponentProps;
