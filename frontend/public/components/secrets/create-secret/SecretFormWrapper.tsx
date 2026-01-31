import type { FC } from 'react';
import * as _ from 'lodash';
import { useState, FormEvent } from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  TextInput,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  ButtonVariant,
} from '@patternfly/react-core';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { k8sCreate, k8sUpdate, K8sResourceKind, referenceFor } from '../../../module/k8s';
import { ButtonBar } from '../../utils/button-bar';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { resourceObjPath } from '../../utils/resource-link';
import { SecretModel } from '../../../models';
import { SecretFormType } from './types';
import {
  toDefaultSecretType,
  determineSecretType,
  useSecretTitle,
  useSecretDescription,
} from './utils';
import { SecretSubForm } from './SecretSubForm';
import { isBinary } from 'istextorbinary';

export const SecretFormWrapper: FC<BaseEditSecretProps_> = (props) => {
  const { formType, isCreate, modal, onCancel } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();

  const existingSecret = _.pick(props.obj, ['metadata', 'type']);
  const defaultSecretType = toDefaultSecretType(formType);
  const initialSecret = _.defaultsDeep({}, props.fixed, existingSecret, {
    apiVersion: 'v1',
    data: {},
    kind: 'Secret',
    metadata: {
      name: '',
    },
    type: defaultSecretType,
  });

  const [secret, setSecret] = useState(initialSecret);
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState();
  const [stringData, setStringData] = useState(
    Object.entries(props.obj?.data ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
      if (isBinary(null, Buffer.from(value, 'base64'))) {
        return acc;
      }
      acc[key] = value ? Base64.decode(value) : '';
      return acc;
    }, {}),
  );
  const [base64StringData, setBase64StringData] = useState(props?.obj?.data ?? {});
  const [disableForm, setDisableForm] = useState(false);
  const title = useSecretTitle(isCreate, formType);
  const helptext = useSecretDescription(formType);
  const cancel = () => navigate(`/k8s/ns/${params.ns}/core~v1~Secret`);

  const onDataChanged = (secretsData) => {
    setStringData({ ...secretsData?.stringData });
    setBase64StringData({ ...secretsData?.base64StringData });
  };

  const onError = (err) => {
    setError(err);
    setInProgress(false);
  };

  const onNameChanged = (_event: FormEvent<HTMLInputElement>, value: string) => {
    const newSecret = _.cloneDeep(secret);
    newSecret.metadata.name = value;
    setSecret(newSecret);
  };

  const save = (e) => {
    e.preventDefault();
    const { metadata } = secret;
    setInProgress(true);
    const data = {
      ..._.mapValues(stringData, (value, key) => {
        // SSH private keys should end with a newline
        const finalValue =
          key === 'ssh-privatekey' && value && !value.endsWith('\n') ? `${value}\n` : value;
        return Base64.encode(finalValue);
      }),
      ...base64StringData,
    };
    const newSecret = _.assign(
      {},
      secret,
      {
        data,
      },
      // When creating new Secret, determine it's type from the `stringData` keys.
      // When updating a Secret, use it's type.
      isCreate ? { type: determineSecretType(stringData) } : {},
    );
    (isCreate
      ? k8sCreate(SecretModel, newSecret)
      : k8sUpdate(SecretModel, newSecret, metadata.namespace, newSecret.metadata.name)
    ).then(
      (s) => {
        setInProgress(false);
        if (props.onSave) {
          props.onSave(s.metadata.name);
        }
        if (!props.modal) {
          navigate(resourceObjPath(s, referenceFor(s)));
        }
      },
      (err) => {
        setError(err.message);
        setInProgress(false);
      },
    );
  };

  const renderBody = () => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define

    return (
      <Form>
        <FormGroup label={t('public~Secret name')} isRequired fieldId="secret-name">
          <TextInput
            type="text"
            onChange={onNameChanged}
            value={secret?.metadata?.name || ''}
            id="secret-name"
            data-test="secret-name"
            isRequired
            isDisabled={!isCreate}
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem>{t('public~Unique name of the new secret.')}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <SecretSubForm
          formType={formType}
          onChange={onDataChanged}
          onError={onError}
          onFormDisable={(disable) => setDisableForm(disable)}
          stringData={stringData}
          secretType={secret.type}
          isCreate={isCreate}
          base64StringData={base64StringData}
        />
      </Form>
    );
  };

  return modal ? (
    <Modal isOpen={true} onClose={onCancel || cancel} title={title} variant={ModalVariant.medium}>
      <ModalHeader title={title} />
      <ModalBody>{renderBody()}</ModalBody>
      <ModalFooter>
        <Button
          type="submit"
          variant={ButtonVariant.primary}
          isLoading={inProgress}
          isDisabled={disableForm}
          onClick={save}
        >
          {t('public~Create')}
        </Button>
        <Button variant={ButtonVariant.link} onClick={onCancel || cancel} isDisabled={inProgress}>
          {t('public~Cancel')}
        </Button>
        {error && <div className="pf-v6-u-danger-color-100 pf-v6-u-mt-md">{error}</div>}
      </ModalFooter>
    </Modal>
  ) : (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading title={title} helpText={helptext} />
      <PaneBody className="co-m-pane__form">
        <Form onSubmit={save}>
          {renderBody()}
          <ButtonBar errorMessage={error} inProgress={inProgress}>
            <ActionGroup>
              <Button
                type="submit"
                data-test="save-changes"
                isDisabled={disableForm}
                variant="primary"
                id="save-changes"
              >
                {props.saveButtonText || t('public~Create')}
              </Button>
              <Button type="button" variant="secondary" id="cancel" onClick={onCancel || cancel}>
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </Form>
      </PaneBody>
    </>
  );
};

type BaseEditSecretProps_ = {
  obj?: K8sResourceKind;
  fixed: any;
  kind?: string;
  isCreate?: boolean;
  modal?: boolean;
  formType?: SecretFormType;
  saveButtonText?: string;
  onCancel?: () => void;
  onSave?: (name: string) => void;
};
