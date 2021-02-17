import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, FormGroup, TextInput, TextContent, Text, TextVariants } from '@patternfly/react-core';
import { SecretModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s/resource';
import { useActiveNamespace } from '@console/shared';
import { AccessTokenSecretName } from '../../const';
import { createServiceAccountIfNeeded } from '../managed-services-kafka/resourceCreators';

export const AccessManagedServices: any = () => {
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
  }

  const handleApiTokenValueChange = (value) => {
    setApiTokenValue(value);
  }

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h2}>{t('rhoas-plugin~Access Red Hat application services with API Token')}</Text>
        <Text component={TextVariants.p}>
          <span>
            {t('rhoas-plugin~To access this application service, input the API token which can be located at')}
            <a href="https://cloud.redhat.com/openshift/token" target="_blank"> https://cloud.redhat.com/openshift/token</a>
          </span>
        </Text>
      </TextContent>
      <Form>
          <FormGroup
            fieldId="api-token-value"
            label="API Token"
            isRequired
            helperText={`${t('rhoas-plugin~API token can be accessed at')} cloud.redhat.com/openshift/token`}
            // helperTextInvalid=""
            // helperTextInvalidIcon={}
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
          <TextContent>
            <Text component={TextVariants.small}>
              {t('rhoas-plugin~Cant create an access token? Contact your administrator')}
            </Text>
          </TextContent>
          <FormGroup fieldId="action-group">
            <Button key="confirm" variant="primary" onClick={onCreate} isDisabled={apiTokenValue.length < 1 ? true : false}>
              {t('rhoas-plugin~Create')}
            </Button>
            <Button key="cancel" variant="link">
              {t('rhoas-plugin~Cancel')}
            </Button>
          </FormGroup>
        </Form>
    </>
  )
}
