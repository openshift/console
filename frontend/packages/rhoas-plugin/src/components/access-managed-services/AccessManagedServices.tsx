import * as React from 'react';
import { SecretModel } from '@console/internal/models';
import { Helmet } from 'react-helmet';
import { PageBody } from '@console/shared';
import { PageHeading } from '@console/internal/components/utils';
// To be clarified if we watch for resource on second page
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { k8sCreate } from '@console/internal/module/k8s/resource';
import { Button, FormGroup, TextInput } from '@patternfly/react-core';
import { useActiveNamespace } from '@console/shared';
import { AccessTokenSecretName } from '../../const'

// TODO Full typings
const AccessManagedServices: any = () => {
  const [apiTokenValue, setApiTokenValue] = React.useState("");
  const [currentNamespace] = useActiveNamespace();

  const namespace = currentNamespace;

  console.log("Token page rendered for namespace ", namespace, apiTokenValue, AccessTokenSecretName)

  const [tokenSecret] = useK8sWatchResource({ kind: SecretModel.kind, isList: false, name: AccessTokenSecretName, namespace, namespaced: true })
  console.log(tokenSecret)

  if (tokenSecret) {
    {/* FIXME - improve component */ }
    return (<>
      <div style={{ width: "100%", height: 300, backgroundColor: "#D3D3D3", padding: 10 }}>
        <h2>  You have already setup connection details to Managed Services</h2>
      </div>
      {/* FIXME - allow to pach secret - if they are like different user or something */}
    </>)
  }

  const onSubmit = async () => {
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

  return (
    <>
      <div style={{ backgroundColor: "#D3D3D3", padding: 10 }}>
        <Helmet>
          <title>Access managed services with API Token</title>
        </Helmet>
        <PageHeading
          className="rhoas__page-heading"
          title="Access managed services with API Token"
        >
          <span>
            To access this managed service please provide the API token which can be located at
          <a href="https://cloud.redhat.com/openshift/token" target="_blank" >https://cloud.redhat.com/openshift/token</a>
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
              onChange={(value: string) => setApiTokenValue(value)}

              type="text"
              id="TODOID?"
              name=""
            />

            <p></p>
            <Button variant="secondary" onClick={() => onSubmit()}>
              Connect
          </Button>
          </FormGroup>
        </PageBody>
      </div>
    </>
  )

}

export default AccessManagedServices;
