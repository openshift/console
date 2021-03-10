import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Form,
  FormGroup,
  TextInput,
  TextContent,
  Text,
  TextVariants,
  Alert,
} from '@patternfly/react-core';
import { useActiveNamespace } from '@console/shared';
import { createServiceAccountIfNeeded, createSecretIfNeeded } from '../../utils/resourceCreators';

export const ServiceToken: any = () => {
  const [sendDisabled, setSendDisabled] = React.useState(false);
  const [apiTokenValue, setApiTokenValue] = React.useState<string>('');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [currentNamespace] = useActiveNamespace();
  const namespace = currentNamespace;
  const { t } = useTranslation();

  const onCreate = async () => {
    setSendDisabled(true);
    try {
      await createSecretIfNeeded(namespace, apiTokenValue);
    } catch (error) {
      setErrorMessage(`Problem with creating secret: ${error}`);
      setSendDisabled(false);
      return;
    }
    try {
      await createServiceAccountIfNeeded(namespace);
    } catch (error) {
      setErrorMessage(`Cannot create service account: ${error}`);
    }
    setSendDisabled(false);
  };

  const handleApiTokenValueChange = (value) => {
    setApiTokenValue(value);
  };

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h2}>
          {t('rhoas-plugin~Access Red Hat Cloud Services with API Token')}
        </Text>
        <Text component={TextVariants.p}>
          <span>
            {t(
              'rhoas-plugin~To access this Cloud Service, input the API token which can be located at',
            )}
            <a
              href="https://cloud.redhat.com/openshift/token"
              rel="noopener noreferrer"
              target="_blank"
            >
              {' '}
              https://cloud.redhat.com/openshift/token
            </a>
          </span>
        </Text>
      </TextContent>
      <Form>
        <FormGroup
          fieldId="api-token-value"
          label="API Token"
          isRequired
          helperText={`${t(
            'rhoas-plugin~API token can be accessed at',
          )} cloud.redhat.com/openshift/token`}
        >
          <TextInput
            value={apiTokenValue}
            onChange={(value: string) => handleApiTokenValueChange(value)}
            type="password"
            id="offlinetoken"
            name="apitoken"
            placeholder=""
          />
        </FormGroup>
        <TextContent>
          <Text component={TextVariants.small}>
            {t('rhoas-plugin~Cant create an access token? Contact your administrator')}
          </Text>
        </TextContent>
        {errorMessage && (
          <TextContent>
            <Alert variant="danger" isInline title={errorMessage} />
          </TextContent>
        )}
        <FormGroup fieldId="action-group">
          <Button
            key="confirm"
            variant="primary"
            onClick={onCreate}
            isDisabled={apiTokenValue.length < 500 ? true : sendDisabled}
          >
            {t('rhoas-plugin~Create')}
          </Button>
          <Button
            key="reset"
            variant="link"
            onClick={() => {
              setApiTokenValue('');
              setErrorMessage('');
            }}
          >
            {t('rhoas-plugin~Reset')}
          </Button>
        </FormGroup>
      </Form>
    </>
  );
};
