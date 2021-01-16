import * as React from 'react';
import StreamsInstancePage from '../streams-list/StreamsInstancePage';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { Button, ActionList, ActionListItem } from '@patternfly/react-core';
import { PageBody } from '@console/shared';

const ManagedKafkas = () => {


  const onSubmit = async (event) => {
    event.preventDefault();
    const existingSecret = await k8sGet(SecretModel.kind, "testsomesecret", "default", {})
    console.log(existingSecret)

    if (existingSecret) {
      return;
    }

    const secret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: 'testsomesecret',
        namespace: "default",
      },
      stringData: {
        accessToken: "hardcoded"
      },
      type: 'Opaque',
    };

    const mkRequest = {
      apiVersion: ManagedKafkaRequestModel.apiVersion,
      kind: ManagedKafkaRequestModel.kind,
      metadata: {
        name: 'KafkaRequest-' + new Date().getTime(),
        // TODO - namespace based url
        namespace: "default",
      },
      spec: {
        accessTokenSecretName: "testsomesecret",
      },
    };

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
