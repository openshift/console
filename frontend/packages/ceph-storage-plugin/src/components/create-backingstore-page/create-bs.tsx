import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import * as React from 'react';
import { ActionGroup, Button, FormGroup, Form, TextInput, Tooltip } from '@patternfly/react-core';
import {
  ButtonBar,
  Dropdown,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { apiVersionForModel, k8sCreate, referenceForModel } from '@console/internal/module/k8s';
import { ModalComponentProps } from '@console/internal/components/factory';
import { getName } from '@console/shared';
import { SecretModel } from '@console/internal/models';
import { history } from '@console/internal/components/utils/router';
import { CEPH_STORAGE_NAMESPACE } from '@console/ceph-storage-plugin/src/constants';
import { providerDataReducer, initialState } from './reducer';
import { NooBaaBackingStoreModel } from '../../models';
import '../noobaa-provider-endpoints/noobaa-provider-endpoints.scss';
import {
  BC_PROVIDERS,
  NOOBAA_TYPE_MAP,
  PROVIDERS_NOOBAA_MAP,
  BUCKET_LABEL_NOOBAA_MAP,
} from '../../constants';
import { getExternalProviders, getProviders, secretPayloadCreator } from '../../utils/noobaa-utils';
import { Payload } from '../../types';
import { PVCType } from '../noobaa-provider-endpoints/pvc-endpoint-type';
import { S3EndPointType } from '../noobaa-provider-endpoints/s3-endpoint-type';
import { GCPEndpointType } from '../noobaa-provider-endpoints/gcp-endpoint-type';
import { StoreType } from '../../constants/common';

const PROVIDERS = getProviders(StoreType.BS);
const externalProviders = getExternalProviders(StoreType.BS);

const CreateBackingStoreForm: React.FC<CreateBackingStoreFormProps> = withHandlePromise<
  CreateBackingStoreFormProps & HandlePromiseProps
>((props) => {
  const { t } = useTranslation();
  const [bsName, setBsName] = React.useState('');
  const [provider, setProvider] = React.useState(BC_PROVIDERS.AWS);
  const [providerDataState, providerDataDispatch] = React.useReducer(
    providerDataReducer,
    initialState,
  );

  const handleBsNameTextInputChange = (strVal: string) => {
    if (strVal.length <= 43) {
      setBsName(strVal);
    }
  };

  const {
    cancel,
    className,
    close,
    inProgress,
    errorMessage,
    handlePromise,
    isPage,
    appName,
    namespace,
  } = props;

  const onSubmit = (event) => {
    event.preventDefault();
    /** Create a secret if secret ==='' */
    let { secretName } = providerDataState;
    const promises = [];
    if (!secretName && provider !== BC_PROVIDERS.PVC) {
      secretName = bsName.concat('-secret');
      const { secretKey, accessKey, gcpJSON } = providerDataState;
      const secretPayload = secretPayloadCreator(
        provider,
        namespace,
        secretName,
        accessKey || gcpJSON,
        secretKey,
      );
      providerDataDispatch({ type: 'setSecretName', value: secretName });
      promises.push(k8sCreate(SecretModel, secretPayload));
    }
    /** Payload for bs */
    const bsPayload: Payload = {
      apiVersion: apiVersionForModel(NooBaaBackingStoreModel),
      kind: NooBaaBackingStoreModel.kind,
      metadata: {
        namespace,
        name: bsName,
      },
      spec: {
        type: NOOBAA_TYPE_MAP[provider],
        ssl: false,
      },
    };
    if (provider === BC_PROVIDERS.PVC) {
      // eslint-disable-next-line
      bsPayload.spec['pvPool'] = {
        numVolumes: providerDataState.numVolumes,
        storageClass: providerDataState.storageClass,
        resources: {
          requests: {
            storage: providerDataState.volumeSize,
          },
        },
      };
    } else if (externalProviders.includes(provider)) {
      bsPayload.spec = {
        ...bsPayload.spec,
        [PROVIDERS_NOOBAA_MAP[provider]]: {
          [BUCKET_LABEL_NOOBAA_MAP[provider]]: providerDataState.target,
          secret: {
            name: secretName,
            namespace,
          },
        },
      };
    }
    if (provider === BC_PROVIDERS.S3) {
      // eslint-disable-next-line
      bsPayload.spec['s3Compatible'] = {
        // eslint-disable-next-line
        ...bsPayload.spec['s3Compatible'],
        endpoint: providerDataState.endpoint,
      };
    } else if (provider === BC_PROVIDERS.IBM) {
      bsPayload.spec.ibmCos = { ...bsPayload.spec.ibmCos, endpoint: providerDataState.endpoint };
    }
    // Add region in the end
    if (provider === BC_PROVIDERS.AWS) {
      bsPayload.spec.awsS3 = { ...bsPayload.spec.awsS3, region: providerDataState.region };
    }

    promises.push(k8sCreate(NooBaaBackingStoreModel, bsPayload));
    return handlePromise(Promise.all(promises), (resource) => {
      const lastIndex = resource.length - 1;
      if (isPage)
        history.push(
          `/k8s/ns/${namespace}/clusterserviceversions/${appName}/${referenceForModel(
            NooBaaBackingStoreModel,
          )}/${getName(resource[lastIndex])}`,
        );
      else close();
    });
  };

  return (
    <Form className={classNames('nb-endpoints-form', className)} onSubmit={onSubmit}>
      <FormGroup
        label={t('ceph-storage-plugin~BackingStore Name')}
        fieldId="backingstore-name"
        className="nb-endpoints-form-entry"
        helperText={t('ceph-storage-plugin~A unique name for the BackingStore  within the project')}
        isRequired
      >
        <Tooltip
          content={t('ceph-storage-plugin~Name can contain a max of 43 characters')}
          isVisible={bsName.length > 42}
          trigger="manual"
        >
          <TextInput
            onChange={handleBsNameTextInputChange}
            value={bsName}
            maxLength={43}
            data-test="backingstore-name"
            placeholder="my-backingstore"
            aria-label={t('ceph-storage-plugin~BackingStore Name')}
          />
        </Tooltip>
      </FormGroup>

      <FormGroup
        label={t('ceph-storage-plugin~Provider')}
        fieldId="provider-name"
        className="nb-endpoints-form-entry"
        isRequired
      >
        <Dropdown
          className="nb-endpoints-form-entry__dropdown"
          buttonClassName="nb-endpoints-form-entry__dropdown"
          dataTest="backingstore-provider"
          onChange={setProvider}
          items={PROVIDERS}
          selectedKey={provider}
        />
      </FormGroup>
      {provider === BC_PROVIDERS.GCP && (
        <GCPEndpointType
          state={providerDataState}
          dispatch={providerDataDispatch}
          namespace={CEPH_STORAGE_NAMESPACE}
        />
      )}
      {(provider === BC_PROVIDERS.AWS ||
        provider === BC_PROVIDERS.S3 ||
        provider === BC_PROVIDERS.IBM ||
        provider === BC_PROVIDERS.AZURE) && (
        <S3EndPointType
          type={StoreType.BS}
          provider={provider}
          namespace={CEPH_STORAGE_NAMESPACE}
          state={providerDataState}
          dispatch={providerDataDispatch}
        />
      )}
      {provider === BC_PROVIDERS.PVC && (
        <PVCType state={providerDataState} dispatch={providerDataDispatch} />
      )}
      <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
        <ActionGroup>
          <Button
            isDisabled={provider === BC_PROVIDERS.PVC && providerDataState.numVolumes < 1}
            type="submit"
            data-test="backingstore-create-button"
            variant="primary"
          >
            {t('ceph-storage-plugin~Create BackingStore')}
          </Button>
          <Button onClick={cancel} variant="secondary">
            {t('ceph-storage-plugin~Cancel')}
          </Button>
        </ActionGroup>
      </ButtonBar>
    </Form>
  );
});

export default CreateBackingStoreForm;

type CreateBackingStoreFormProps = ModalComponentProps & {
  isPage?: boolean;
  namespace?: string;
  className?: string;
  appName?: string;
};
