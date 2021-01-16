import * as React from 'react';
import StreamsInstancePage from '../streams-list/StreamsInstancePage';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { Button, ActionList, ActionListItem } from '@patternfly/react-core';
import { PageBody } from '@console/shared';

const ManagedKafkas = () => {

  // TODO change namespace from URL (args)
  const namespace = "default";
  const secretName = "MyLittleSecret"
  const accessToken = "notrelevantyet"

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
  }


  return (
    <>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        <StreamsInstancePage />
        <PageBody>
          <ActionList>
            <ActionListItem>
              <Button variant="primary" id="create-button">
                Create
              </Button>
            </ActionListItem>
            <ActionListItem>
              <Button variant="secondary" id="cancels-button">
                Cancel
              </Button>
            </ActionListItem>
          </ActionList>
        </PageBody>
      </NamespacedPage>
    </>
  );
};

export default ManagedKafkas;
