import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormGroup, TextInput, Form } from '@patternfly/react-core';

import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { withHandlePromise } from '@console/internal/components/utils/promise-component';
import { AdvancedKMSModalProps } from '../../kms-config/providers';
import { HpcsConfig, ProviderNames } from '../../../types';
import './advanced-kms-modal.scss';

/**
 * This Modal is not used anywhere right now,
 * Not removing it though, might be useful in upcoming release.
 */
export const AdvancedHpcsModal = withHandlePromise((props: AdvancedKMSModalProps) => {
  const { close, cancel, errorMessage, inProgress, state, dispatch } = props;
  const kms: HpcsConfig = state.kms?.[ProviderNames.HPCS];
  const { t } = useTranslation();
  const [baseUrl, setBaseUrl] = React.useState(kms?.baseUrl.value || '');
  const [tokenUrl, setTokenUrl] = React.useState(kms?.tokenUrl || '');

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    kms.baseUrl.value = baseUrl;
    const kmsAdvanced = {
      ...kms,
      tokenUrl,
    };
    dispatch({ type: 'securityAndNetwork/setHpcs', payload: kmsAdvanced });
    close();
  };

  return (
    <Form onSubmit={submit} key="advanced-ibm-kms-modal">
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>{t('ceph-storage-plugin~Key Management Service Advanced Settings')}</ModalTitle>
        <ModalBody>
          <FormGroup
            fieldId="kms-base-url"
            label={t('ceph-storage-plugin~IBM Base URL')}
            className="ceph-advanced-kms__form-body"
          >
            <TextInput
              value={kms.baseUrl.value}
              onChange={setBaseUrl}
              type="text"
              id="kms-base-url"
              name="kms-base-url"
              data-test="kms-base-url"
            />
          </FormGroup>
          <FormGroup
            fieldId="kms-token-url"
            label={t('ceph-storage-plugin~IBM Token URL')}
            className="ceph-advanced-kms__form-body"
          >
            <TextInput
              value={tokenUrl}
              onChange={setTokenUrl}
              type="text"
              id="kms-token-url"
              name="kms-token-url"
              data-test="kms-token-url"
            />
          </FormGroup>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          inProgress={inProgress}
          submitText={t('ceph-storage-plugin~Save')}
          cancel={cancel}
        />
      </div>
    </Form>
  );
});

export const advancedHpcsModal = createModalLauncher(AdvancedHpcsModal);
