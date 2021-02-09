import * as React from 'react';
import { SecretModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s/resource';
import { Button, Form, FormGroup, Modal, ModalVariant, TextInput } from '@patternfly/react-core';
import { useActiveNamespace } from '@console/shared';
import { AccessTokenSecretName } from '../../const';
import { createServiceAccountIfNeeded } from '../managed-services-kafka/resourceCreators';
import { useTranslation } from 'react-i18next';

// TODO Full typings
const AccessManagedServices: any = ({ isModalOpen, setIsModalOpen }) => {
  const [apiTokenValue, setApiTokenValue] = React.useState("");
  const [currentNamespace] = useActiveNamespace();
  const namespace = currentNamespace;
  const { t } = useTranslation();

  const onCreate = async () => {
    const secret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: AccessTokenSecretName,
        namespace
      },
      stringData: {
        value: apiTokenValue
      },
      type: 'Opaque',
    };

    await k8sCreate(SecretModel, secret);
    await createServiceAccountIfNeeded(namespace);
    setIsModalOpen(false);
  }

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  }

  const handleApiTokenValueChange = (value) => {
    setApiTokenValue(value);
  }

  return (
    <>
      <Modal
        title={t('rhoas-plugin~Access Red Hat application services')}
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        variant={ModalVariant.small}
        actions={[
          <Button key="confirm" variant="primary" onClick={onCreate} isDisabled={apiTokenValue.length < 1 ? true : false}>
            {t('rhoas-plugin~Create')}
          </Button>,
          <Button key="cancel" variant="link" onClick={handleModalToggle}>
            {t('rhoas-plugin~Cancel')}
          </Button>
        ]}
      >
        {t('rhoas-plugin~To access this application service, input the API token which can be located at')}
        <a href="https://cloud.redhat.com/openshift/token" target="_blank"> https://cloud.redhat.com/openshift/token</a>
        <br />
        <br />
        <Form>
          <FormGroup
            fieldId="api-token-value"
            label="API Token"
            isRequired
            helperText={`${t('rhoas-plugin~API token can be accessed at')} cloud.redhat.com/openshift/token`}
          // helperTextInvalid="Age has to be a number"
          // helperTextInvalidIcon={<ExclamationCircleIcon />}
          >
            <TextInput
              value={apiTokenValue}
              onChange={(value: string) => handleApiTokenValueChange(value)}
              type="text"
              id=""
              name=""
              placeholder=""
            />
          </FormGroup>
        </Form>
        <br />
        {t('rhoas-plugin~Cant create an access token? Contact your administrator')}
      </Modal>
    </>
  )
}

export default AccessManagedServices;
