import * as _ from 'lodash-es';
import * as React from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { ActionGroup, Button } from '@patternfly/react-core';
import { useParams, useNavigate } from 'react-router-dom';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { k8sCreate, k8sUpdate, K8sResourceKind, referenceFor } from '../../../module/k8s';
import { ButtonBar } from '../../utils/button-bar';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { resourceObjPath } from '../../utils/resource-link';
import { ModalBody, ModalTitle, ModalSubmitFooter } from '../../factory/modal';
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

export const SecretFormWrapper: React.FC<BaseEditSecretProps_> = (props) => {
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

  const [secret, setSecret] = React.useState(initialSecret);
  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState();
  const [stringData, setStringData] = React.useState(
    Object.entries(props.obj?.data ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
      if (isBinary(null, Buffer.from(value, 'base64'))) {
        return null;
      }
      acc[key] = value ? Base64.decode(value) : '';
      return acc;
    }, {}),
  );
  const [base64StringData, setBase64StringData] = React.useState(props?.obj?.data ?? {});
  const [disableForm, setDisableForm] = React.useState(false);
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

  const onNameChanged = (event) => {
    const name = event.target.value;
    const newSecret = _.cloneDeep(secret);
    newSecret.metadata.name = name;
    setSecret(newSecret);
  };

  const save = (e) => {
    e.preventDefault();
    const { metadata } = secret;
    setInProgress(true);
    const data = {
      ..._.mapValues(stringData, (value) => {
        return Base64.encode(value);
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
      <>
        <fieldset disabled={!isCreate}>
          <div className="form-group">
            <label className="co-required" htmlFor="secret-name">
              {t('public~Secret name')}
            </label>
            <div>
              <span className="pf-v6-c-form-control">
                <input
                  type="text"
                  onChange={onNameChanged}
                  value={secret?.metadata?.name}
                  aria-describedby="secret-name-help"
                  id="secret-name"
                  data-test="secret-name"
                  required
                />
              </span>
              <p className="help-block" id="secret-name-help">
                {t('public~Unique name of the new secret.')}
              </p>
            </div>
          </div>
        </fieldset>
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
      </>
    );
  };

  return modal ? (
    <form className="co-create-secret-form modal-content" onSubmit={save}>
      <ModalTitle>{title}</ModalTitle>
      <ModalBody>{renderBody()}</ModalBody>
      <ModalSubmitFooter
        errorMessage={error || ''}
        inProgress={inProgress}
        submitText={t('public~Create')}
        cancel={onCancel || cancel}
      />
    </form>
  ) : (
    <div className="co-m-pane__form">
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading title={title} helpText={helptext} />
      <PaneBody>
        <form className="co-create-secret-form" onSubmit={save}>
          {renderBody()}
          <ButtonBar errorMessage={error} inProgress={inProgress}>
            <ActionGroup className="pf-v6-c-form">
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
        </form>
      </PaneBody>
    </div>
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
