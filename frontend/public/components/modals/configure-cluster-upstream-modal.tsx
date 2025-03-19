import * as React from 'react';
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
  createModalLauncher,
} from '../factory/modal';
import {
  documentationURLs,
  ExternalLink,
  getDocumentationURL,
  HandlePromiseProps,
  isManaged,
  isUpstream,
  withHandlePromise,
} from '../utils';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { CLUSTER_VERSION_DEFAULT_UPSTREAM_SERVER_URL_PLACEHOLDER } from '@console/shared/src/constants';

export const ConfigureClusterUpstreamModal = withHandlePromise(
  (props: ConfigureClusterUpstreamModalProps) => {
    const { cv, handlePromise, close } = props;
    const currentUpstream = cv?.spec?.upstream;

    const [customSelected, setCustomSelected] = React.useState(!!currentUpstream);
    const [customURL, setCustomURL] = React.useState(currentUpstream ?? '');
    const customURLInputRef = React.useRef(null);
    const [invalidCustomURL, setInvalidCustomURL] = React.useState(false);

    const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
      e.preventDefault();
      if (customSelected) {
        if (!customURL) {
          setInvalidCustomURL(true);
          return;
        } else if (customURL === currentUpstream) {
          return handlePromise(Promise.resolve(), close);
        }
      } else if (!currentUpstream) {
        return handlePromise(Promise.resolve(), close);
      }
      const value = customSelected ? customURL : null;
      const patch = [{ op: 'add', path: '/spec/upstream', value }];
      return handlePromise(k8sPatch(ClusterVersionModel, cv, patch), close);
    };
    const { t } = useTranslation();

    const updateURL = getDocumentationURL(documentationURLs.updateService);

    return (
      <>
        <ModalTitle>{t('public~Edit upstream configuration')}</ModalTitle>
        <Form onSubmit={submit} name="form" className="co-form--within-modal">
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
            errorMessage={props.errorMessage}
            inProgress={props.inProgress}
            submitText={t('public~Save')}
            cancel={props.cancel}
            submitDisabled={invalidCustomURL}
          />
        </Form>
      </>
    );
  },
);

export const configureClusterUpstreamModal = createModalLauncher(ConfigureClusterUpstreamModal);

export type ConfigureClusterUpstreamModalProps = {
  cv: ClusterVersionKind;
  t: TFunction;
} & ModalComponentProps &
  HandlePromiseProps;
