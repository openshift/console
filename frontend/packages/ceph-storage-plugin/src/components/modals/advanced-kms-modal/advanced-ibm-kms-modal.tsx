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
import { IbmKmsConfig, ProviderNames } from '../../../types';
import './advanced-kms-modal.scss';

export const AdvancedIbmKmsModal = withHandlePromise((props: AdvancedKMSModalProps) => {
  const { close, cancel, errorMessage, inProgress, state, dispatch } = props;
  const kms: IbmKmsConfig = state.kms?.[ProviderNames.IBMROKS];
  const { t } = useTranslation();
  const [baseUrl, setBaseUrl] = React.useState(kms?.baseUrl || '');
  const [tokenUrl, setTokenUrl] = React.useState(kms?.tokenUrl || '');

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    const kmsAdvanced = {
      ...kms,
      baseUrl,
      tokenUrl,
    };
    dispatch({ type: 'securityAndNetwork/setIbmKms', payload: kmsAdvanced });
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
              value={baseUrl}
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

export const advancedIbmKmsModal = createModalLauncher(AdvancedIbmKmsModal);
