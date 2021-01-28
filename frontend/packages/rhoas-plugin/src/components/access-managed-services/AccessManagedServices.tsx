import * as React from 'react';
import { SecretModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s/resource';
import { Button, FormGroup, Modal, ModalVariant, TextInput } from '@patternfly/react-core';
import { useActiveNamespace } from '@console/shared';
import { AccessTokenSecretName } from '../../const';
import { history } from '@console/internal/components/utils';

// TODO Full typings
const AccessManagedServices: any = ({isModalOpen, setIsModalOpen}) => {
  const [apiTokenValue, setApiTokenValue] = React.useState("");
  const [currentNamespace] = useActiveNamespace();
  const namespace = currentNamespace;

  const onCreate = async () => {
    const secret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: AccessTokenSecretName,
        namespace
      },
      stringData: {
        apiTokenValue
      },
      type: 'Opaque',
    };

    try {
      await k8sCreate(SecretModel, secret);
      history.push("/managedServices/managedkafka");
    } catch (error) {
      console.log('what is this error' + error);
    }

    // IMPORTANT! CVE prevention
    // setApiTokenValue("");
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
        title="Access Red Hat application services with API Token"
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        variant={ModalVariant.small}
        actions={[
          <Button key="confirm" variant="primary" onClick={onCreate}>
            Create
          </Button>,
          <Button key="cancel" variant="link" onClick={handleModalToggle}>
            Cancel
          </Button>
        ]}
      >
        To access this application service, input the API token which can be located at
        <a href="https://cloud.redhat.com/openshift/token" target="_blank"> https://cloud.redhat.com/openshift/token</a>
        <br/>
        <br/>
        <FormGroup
          fieldId=""
          label="API Token"
          isRequired
          helperText="API token can be access at cloud.redhat.com/openshift/token"
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
        <br/>
        Can't create an access token? Contact your administrator
      </Modal>
    </>
  )
}

export default AccessManagedServices;
