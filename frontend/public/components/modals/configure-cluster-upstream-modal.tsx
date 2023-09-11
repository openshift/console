import * as React from 'react';

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
import { RadioInput } from '../radio';
import { CLUSTER_VERSION_DEFAULT_UPSTREAM_SERVER_URL_PLACEHOLDER } from '@console/shared/src/constants';
import { TextInput } from '@patternfly/react-core';

export const ConfigureClusterUpstreamModal = withHandlePromise(
  (props: ConfigureClusterUpstreamModalProps) => {
    const { cv, handlePromise, close } = props;
    const currentUpstream = cv?.spec?.upstream;

    const [customSelected, setCustomSelected] = React.useState(!!currentUpstream);
    const [customURL, setCustomURL] = React.useState(currentUpstream);
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
      <form onSubmit={submit} name="form" className="modal-content">
        <ModalTitle>{t('public~Edit upstream configuration')}</ModalTitle>
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
          <div className="form-group">
            <fieldset>
              <label>{t('public~Configuration')}</label>
              <RadioInput
                value="default"
                onChange={() => {
                  setCustomSelected(false);
                  setInvalidCustomURL(false);
                }}
                checked={!customSelected}
                title={t('public~Default. Receive update information from Red Hat.')}
              >
                <TextInput
                  id={'cluster-version-default-upstream-server-url'}
                  type="url"
                  isDisabled
                  value={CLUSTER_VERSION_DEFAULT_UPSTREAM_SERVER_URL_PLACEHOLDER}
                  readOnlyVariant="default"
                />
              </RadioInput>
              <RadioInput
                value="custom"
                onChange={() => setCustomSelected(true)}
                checked={customSelected}
                title={t('public~Custom update service.')}
              >
                <TextInput
                  id={'cluster-version-custom-upstream-server-url'}
                  type="url"
                  placeholder="https://example.com/api/upgrades_info/v1/graph"
                  value={customURL}
                  onChange={(_event, text) => {
                    setCustomSelected(true);
                    setCustomURL(text);
                    setInvalidCustomURL(false);
                  }}
                  validated={invalidCustomURL ? 'error' : 'default'}
                />
                {invalidCustomURL && (
                  <div className="pf-v5-c-form">
                    <div className="pf-v5-c-form__helper-text pf-m-error">
                      {t('public~Please enter a URL')}
                    </div>
                  </div>
                )}
              </RadioInput>
            </fieldset>
          </div>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={props.errorMessage}
          inProgress={props.inProgress}
          submitText={t('public~Save')}
          cancel={props.cancel}
          submitDisabled={invalidCustomURL}
        />
      </form>
    );
  },
);

export const configureClusterUpstreamModal = createModalLauncher(ConfigureClusterUpstreamModal);

export type ConfigureClusterUpstreamModalProps = {
  cv: ClusterVersionKind;
  t: TFunction;
} & ModalComponentProps &
  HandlePromiseProps;
