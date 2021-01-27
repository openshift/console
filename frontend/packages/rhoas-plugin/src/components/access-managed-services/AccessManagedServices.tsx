import * as React from 'react';
import { SecretModel } from '@console/internal/models';
import { Helmet } from 'react-helmet';
import { PageBody } from '@console/shared';
import { PageHeading } from '@console/internal/components/utils';
// To be clarified if we watch for resource on second page
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { k8sCreate } from '@console/internal/module/k8s/resource';
import { Button, FormGroup, TextInputTypes, Modal, ModalVariant, TextInput } from '@patternfly/react-core';
import { useActiveNamespace } from '@console/shared';
import { AccessTokenSecretName } from '../../const';

// TODO Full typings
const AccessManagedServices: any = ({isModalOpen, setIsModalOpen}) => {
  const [apiTokenValue, setApiTokenValue] = React.useState("");

  const [currentNamespace] = useActiveNamespace();
  const namespace = currentNamespace;
  // console.log("Token page rendered for namespace ", namespace, apiTokenValue, AccessTokenSecretName)
  // const [tokenSecret] = useK8sWatchResource({ kind: SecretModel.kind, isList: false, name: AccessTokenSecretName, namespace, namespaced: true })
  // console.log('what is tokenSecret' + tokenSecret);

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

    // FIXME error handling for create operation
    await k8sCreate(SecretModel, secret);

    // IMPORTANT! CVE prevention
    setApiTokenValue("");
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
        <br/>
        To access this application service, input the API token which can be located at 
        <a href="https://cloud.redhat.com/openshift/token" target="_blank">https://cloud.redhat.com/openshift/token</a>
        <br/>
        <FormGroup
          fieldId=""
          label="API Token"
          isRequired
          helperText="API token can be access at cloud.redhat.com/openshift/token"
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
        Can't create an access token? Contact your cluster administrator
      </Modal>
    </>
  )
}

export default AccessManagedServices;
