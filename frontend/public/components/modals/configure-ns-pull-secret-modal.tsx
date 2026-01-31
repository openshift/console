import * as _ from 'lodash';
import { Base64 } from 'js-base64';
import {
  Alert,
  CodeBlock,
  CodeBlockCode,
  Content,
  ContentVariants,
  FormGroup,
  Grid,
  GridItem,
  Radio,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { FC, ChangeEvent, FormEvent } from 'react';
import { CONST } from '@console/shared';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { k8sPatchByName, k8sCreate, K8sResourceKind } from '../../module/k8s';
import { SecretModel, ServiceAccountModel } from '../../models';
import { useState, useCallback } from 'react';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalWrapper,
  ModalComponentProps,
} from '../factory/modal';
import { ResourceIcon } from '../utils/resource-icon';

interface FormData {
  username: string;
  password: string;
  email: string;
  address: string;
}

const generateSecretData = (formData: FormData): string => {
  const config = {
    auths: {},
  };

  const authParts: string[] = [];

  if (_.trim(formData.username).length >= 1) {
    authParts.push(formData.username);
  }
  authParts.push(formData.password);

  config.auths[formData.address] = {
    auth: Base64.encode(authParts.join(':')),
    email: formData.email,
  };

  return Base64.encode(JSON.stringify(config));
};

interface ConfigureNamespacePullSecretProps extends ModalComponentProps {
  namespace: K8sResourceKind;
  pullSecret?: K8sResourceKind;
}

const ConfigureNamespacePullSecret: FC<ConfigureNamespacePullSecretProps> = (props) => {
  const { namespace, cancel, close } = props;
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const [method, setMethod] = useState<'form' | 'upload'>('form');
  const [fileData, setFileData] = useState<string | null>(null);
  const [invalidJson, setInvalidJson] = useState(false);

  const onMethodChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setMethod(event.target.value as 'form' | 'upload');
  }, []);

  const onFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInvalidJson(false);
    setFileData(null);

    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/json') {
      setInvalidJson(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const input = e.target?.result as string;
      try {
        JSON.parse(input);
      } catch (error) {
        setInvalidJson(true);
        return;
      }
      setFileData(input);
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      let secretData: string;

      if (method === 'upload') {
        secretData = Base64.encode(fileData || '');
      } else {
        const elements = event.currentTarget.elements as any;
        const formData: FormData = {
          username: elements['namespace-pull-secret-username'].value,
          password: elements['namespace-pull-secret-password'].value,
          email: elements['namespace-pull-secret-email'].value || '',
          address: elements['namespace-pull-secret-address'].value,
        };
        secretData = generateSecretData(formData);
      }

      const data: { [key: string]: string } = {};
      const pullSecretName = (event.currentTarget.elements as any)['namespace-pull-secret-name']
        .value;
      data[CONST.PULL_SECRET_DATA] = secretData;

      const secret = {
        metadata: {
          name: pullSecretName,
          namespace: namespace.metadata.name,
        },
        data,
        type: CONST.PULL_SECRET_TYPE,
      };
      const defaultServiceAccountPatch = [
        {
          op: 'add' as const,
          path: '/imagePullSecrets/-',
          value: { name: pullSecretName },
        },
      ];
      const promise = k8sCreate(SecretModel, secret).then(() =>
        k8sPatchByName(
          ServiceAccountModel,
          'default',
          namespace.metadata.name,
          defaultServiceAccountPatch,
        ),
      );

      handlePromise(promise).then(close);
    },
    [method, fileData, namespace, handlePromise, close],
  );

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{t('public~Default pull Secret')}</ModalTitle>
      <ModalBody>
        <Grid hasGutter>
          <GridItem>
            <Content component={ContentVariants.p}>
              {t(
                'public~Specify default credentials to be used to authenticate and download containers within this namespace. These credentials will be the default unless a pod references a specific pull Secret.',
              )}
            </Content>
          </GridItem>

          <GridItem span={3}>
            <label>{t('public~Namespace')}</label>
          </GridItem>
          <GridItem span={9}>
            <ResourceIcon kind="Namespace" /> &nbsp;{namespace.metadata.name}
          </GridItem>

          <GridItem span={3}>
            <label htmlFor="namespace-pull-secret-name">{t('public~Secret name')}</label>
          </GridItem>

          <GridItem span={9}>
            <TextInput
              type="text"
              id="namespace-pull-secret-name"
              aria-describedby="namespace-pull-secret-name-help"
              isRequired
            />
            <Content component={ContentVariants.p} id="namespace-pull-secret-name-help">
              {t('public~Friendly name to help you manage this in the future')}
            </Content>
          </GridItem>

          <GridItem span={3}>
            <label>{t('public~Method')}</label>
          </GridItem>
          <GridItem span={9}>
            <div className="pf-v6-c-form">
              <FormGroup role="radiogroup" fieldId="namespace-pull-secret-method" isStack>
                <Radio
                  id="namespace-pull-secret-method--form"
                  name="namespace-pull-secret-method"
                  label={t('public~Enter username/password')}
                  value="form"
                  onChange={onMethodChange}
                  isChecked={method === 'form'}
                  data-checked-state={method === 'form'}
                />
                <Radio
                  id="namespace-pull-secret-method--upload"
                  name="namespace-pull-secret-method"
                  label={t('public~Upload Docker config.json')}
                  value="upload"
                  onChange={onMethodChange}
                  isChecked={method === 'upload'}
                  data-checked-state={method === 'upload'}
                />
              </FormGroup>
            </div>
          </GridItem>

          {method === 'form' && (
            <>
              <GridItem span={3}>
                <label htmlFor="namespace-pull-secret-address">
                  {t('public~Registry address')}
                </label>
              </GridItem>
              <GridItem span={9}>
                <TextInput
                  type="text"
                  id="namespace-pull-secret-address"
                  placeholder={t('public~quay.io')}
                  isRequired
                />
              </GridItem>

              <GridItem span={3}>
                <label htmlFor="namespace-pull-secret-email">{t('public~Email address')}</label>
              </GridItem>
              <GridItem span={9}>
                <TextInput
                  type="email"
                  id="namespace-pull-secret-email"
                  aria-describedby="namespace-pull-secret-email-help"
                />
                <Content component={ContentVariants.p} id="namespace-pull-secret-email-help">
                  {t('public~Optional, depending on registry provider')}
                </Content>
              </GridItem>

              <GridItem span={3}>
                <label htmlFor="namespace-pull-secret-username">{t('public~Username')}</label>
              </GridItem>
              <GridItem span={9}>
                <TextInput type="text" id="namespace-pull-secret-username" isRequired />
              </GridItem>

              <GridItem span={3}>
                <label htmlFor="namespace-pull-secret-password">{t('public~Password')}</label>
              </GridItem>
              <GridItem span={9}>
                <TextInput type="password" id="namespace-pull-secret-password" isRequired />
              </GridItem>
            </>
          )}

          {method === 'upload' && (
            <>
              <GridItem span={3}>
                <label htmlFor="namespace-pull-secret-file">{t('public~File upload')}</label>
              </GridItem>
              <GridItem span={9}>
                <input
                  type="file"
                  id="namespace-pull-secret-file"
                  onChange={onFileChange}
                  aria-describedby="namespace-pull-secret-file-help"
                />
                <Content component={ContentVariants.p} id="namespace-pull-secret-file-help">
                  {t(
                    'public~Properly configured Docker config file in JSON format. Will be base64 encoded after upload.',
                  )}
                </Content>
              </GridItem>

              {invalidJson && (
                <GridItem span={9} smOffset={3}>
                  <Alert
                    isInline
                    className="co-alert"
                    variant="danger"
                    title={t('public~Invalid JSON')}
                  >
                    {t('public~The uploaded file is not properly-formatted JSON.')}
                  </Alert>
                </GridItem>
              )}
              {fileData && (
                <GridItem span={9} smOffset={3}>
                  <CodeBlock>
                    <CodeBlockCode>{fileData}</CodeBlockCode>
                  </CodeBlock>
                </GridItem>
              )}
            </>
          )}
        </Grid>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Save')}
        cancel={cancel}
        submitDisabled={method === 'upload' && (!fileData || invalidJson)}
      />
    </form>
  );
};

export const ConfigureNamespacePullSecretModalOverlay: OverlayComponent<ConfigureNamespacePullSecretProps> = (
  props,
) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <ConfigureNamespacePullSecret
        {...props}
        cancel={props.closeOverlay}
        close={props.closeOverlay}
      />
    </ModalWrapper>
  );
};
