import * as React from 'react';
import { ManagedKafkaRequestModel } from '../../models';
import { SecretModel } from '@console/internal/models';
import {
  k8sGet,
  k8sCreate,
  k8sWatch
} from '@console/internal/module/k8s';
import { Helmet } from 'react-helmet';
import { PageBody } from '@console/shared';
import { PageHeading } from '@console/internal/components/utils';
// To be clarified if we watch for resource on second page
// import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import {
  FormFooter,
  FlexForm,
  FormHeader,
} from '@console/shared';
import { Button, FormGroup, TextInput } from '@patternfly/react-core';

const AccessManagedServices = ({setAuthenticationSuccess}) => {

  const [ apiTokenValue, setApiTokenValue ] = React.useState("");

  const handleApiTokenValueChange = value => {
    setApiTokenValue(value);
  }

  const handleAuthChange = () => {
    setAuthenticationSuccess(true);
  }

  // TODO change namespace from URL (args)
  const namespace = "default";
  const secretName = "MyLittleSecret"
  const accessToken = "notrelevantyet"

  const [data, loaded, loadError] = useK8sGet(SecretModel, secretName, namespace)

  if (!loaded) {
    return (<>
      <h4>Loading</h4>
    </>)
  }

  console.log(data, loadError);

  if (data) {
    return (<>
      You have already setup connection details to Managed Services
    </>)
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    const existingSecret = await k8sGet(SecretModel.kind, secretName, namespace, {})
    console.log(existingSecret)

    if (existingSecret) {
      return;
    }

    const secret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: secretName,
        namespace
      },
      stringData: {
        accessToken
      },
      type: 'Opaque',
    };

    const mkRequest = {
      apiVersion: ManagedKafkaRequestModel.apiVersion,
      kind: ManagedKafkaRequestModel.kind,
      metadata: {
        // TODO better name generation
        name: 'KafkaRequest-' + new Date().getTime(),
        namespace
      },
      spec: {
        accessTokenSecretName: secretName,
      },
    };

    // TODO proper handling for create
    console.log(await k8sCreate(SecretModel, secret))
    console.log(await k8sCreate(ManagedKafkaRequestModel, mkRequest));
    // TODO This is for tesing and should not be on this page
    k8sWatch(ManagedKafkaRequestModel.kind, {}).onmessage((msg) => {
      console.log("resource updated", msg);
    })
  }



  return (
    <>
      <Helmet>
        <title>Access managed services with API Token</title>
      </Helmet>
      <PageHeading
        className="rhoas__page-heading"
        title="Access managed services with API Token"
      >
        <span>
          To access this managed service, input the API token which can be located at 
          <a href="/">https://qaprodauth.cloud.redhat.com/openshift/token</a>
        </span>
      </PageHeading>
      <PageBody>
        <FormGroup
          fieldId=""
          label="API Token"
          className=""
        >
          <TextInput
            isRequired
            value={apiTokenValue}
            onChange={() => handleApiTokenValueChange()}
            type="text"
            id=""
            name=""
          />
        </FormGroup>
      </PageBody>
    </>
  )

}

export default AccessManagedServices;
