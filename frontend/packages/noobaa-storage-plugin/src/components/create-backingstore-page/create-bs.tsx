import * as classNames from 'classnames';
import * as React from 'react';
import * as _ from 'lodash';
import {
  ActionGroup,
  Button,
  FormGroup,
  Form,
  InputGroupText,
  TextInput,
  InputGroup,
  TextArea,
} from '@patternfly/react-core';
import { HelpIcon, MinusIcon, PlusIcon } from '@patternfly/react-icons';
import {
  ButtonBar,
  Dropdown,
  ExternalLink,
  Firehose,
  HandlePromiseProps,
  NsDropdown,
  RequestSizeInput,
  resourceObjPath,
  withHandlePromise,
} from '@console/internal/components/utils';
import { apiVersionForModel, k8sCreate, referenceFor } from '@console/internal/module/k8s';
import { ModalComponentProps } from '@console/internal/components/factory';
import ResourceDropdown from '@console/dev-console/src/components/dropdown/ResourceDropdown';
import { SecretModel } from '@console/internal/models';
import { DashboardCardPopupLink } from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { getAPIVersion, getName } from '@console/shared';
import { history } from '@console/internal/components/utils/router';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { NooBaaBackingStoreModel } from '../../models';
import './create-bs.scss';

const providers = {
  'AWS S3': 'AWS S3',
  'Azure Blob': 'Azure Blob',
  'Google cloud storage': 'Google cloud storage',
  'S3 Compatible': 'S3 Compatible',
  PVC: 'PVC',
};

const providerNoobaaMap = {
  'AWS S3': 'awsS3',
  'S3 Compatible': 's3Compatible',
  'Azure Blob': 'azureBlob',
  'Google cloud storage': 'googleCloudStorage',
  PVC: 'pvPool',
};

const bucketNoobaaMap = {
  'AWS S3': 'targetBucket',
  'S3 Compatible': 'targetBucket',
  'Azure Blob': 'targetBlobContainer',
};

const typeNoobaaMap = {
  'AWS S3': 'aws-s3',
  'S3 Compatible': 's3-compatible',
  'Azure Blob': 'azure-blob',
  PVC: 'pv-pool',
};

const awsRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'ap-east-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'me-south-1',
  'sa-east-1',
];

const awsRegionItems = _.zipObject(awsRegions, awsRegions);

/**
 * aws-s3, s3 compatible share the same form
 */
const S3EndPointType: React.FC<S3EndpointTypeProps> = (props) => {
  const [showSecret, setShowSecret] = React.useState(true);
  const { provider, namespace, state, dispatch } = props;

  const targetLabel = provider === 'Azure Blob' ? 'Target Container' : 'Target Bucket';
  const credentialField1Label = provider === 'Azure Blob' ? 'Account Name' : 'Access Key';
  const credentialField2Label = provider === 'Azure Blob' ? 'Account Key' : 'Secret Key';
  const resources = [
    {
      isList: true,
      namespace,
      kind: SecretModel.kind,
      prop: 'secrets',
    },
  ];

  const switchToSecret = () => {
    setShowSecret(true);
    dispatch({ type: 'setAccessKey', value: '' });
    dispatch({ type: 'setSecretKey', value: '' });
  };

  const switchToCredentials = () => {
    setShowSecret(false);
    dispatch({ type: 'setSecretName', value: '' });
  };

  return (
    <>
      {provider === 'AWS S3' && (
        <FormGroup label="Region" fieldId="region" className="nb-bs-form-entry" isRequired>
          <Dropdown
            className="nb-bs-form-entry__dropdown"
            buttonClassName="nb-bs-form-entry__dropdown"
            onChange={(e) => {
              dispatch({ type: 'setRegion', value: e });
            }}
            items={awsRegionItems}
            selectedKey={provider}
          />
        </FormGroup>
      )}

      <FormGroup label="Endpoint" fieldId="endpoint" className="nb-bs-form-entry">
        <TextInput
          onChange={(e) => {
            dispatch({ type: 'setEndpoint', value: e });
          }}
          value={state.endpoint}
          aria-label="Endpoint Address"
        />
      </FormGroup>

      {showSecret ? (
        <FormGroup
          label="Secret"
          fieldId="secret-dropdown"
          className="nb-bs-form-entry nb-bs-form-entry--full-width"
        >
          <InputGroup>
            <Firehose resources={resources}>
              <ResourceDropdown
                selectedKey={state.secretName}
                placeholder="Select Secret"
                className="nb-bs-form-entry__dropdown nb-bs-form-entry__dropdown--full-width"
                buttonClassName="nb-bs-form-entry__dropdown"
                dataSelector={['metadata', 'name']}
                onChange={(e) => dispatch({ type: 'setSecretName', value: e })}
              />
            </Firehose>
            <Button variant="plain" onClick={switchToCredentials}>
              Switch to Credentials
            </Button>
          </InputGroup>
        </FormGroup>
      ) : (
        <>
          <FormGroup label={credentialField1Label} fieldId="acess-key">
            <InputGroup>
              <TextInput
                value={state.accessKey}
                onChange={(e) => {
                  dispatch({ type: 'setAccessKey', value: e });
                }}
                aria-label="Access Key Field"
              />
              <Button variant="plain" onClick={switchToSecret}>
                Switch to Secret
              </Button>
            </InputGroup>
          </FormGroup>
          <FormGroup
            className="nb-bs-form-entry"
            label={credentialField2Label}
            fieldId="secret-key"
          >
            <TextInput
              value={state.secretKey}
              onChange={(e) => {
                dispatch({ type: 'setSecretKey', value: e });
              }}
              aria-label="Secret Key Field"
              type="password"
            />
          </FormGroup>
        </>
      )}
      <FormGroup
        label={targetLabel}
        fieldId="target-bucket"
        className="nb-bs-form-entry"
        isRequired
      >
        <TextInput
          value={state.target}
          onChange={(e) => dispatch({ type: 'setTarget', value: e })}
          aria-label={targetLabel}
        />
      </FormGroup>
    </>
  );
};

const PVCType: React.FC<PVCTypeProps> = ({ state, dispatch }) => {
  const [size, setSize] = React.useState('50');
  const [, updateState] = React.useState();
  const units = {
    GiB: 'GiB',
    TiB: 'TiB',
  };

  // Fix for updating the storage class by force rerender
  const forceUpdate = React.useCallback(() => updateState({}), []);

  React.useEffect(() => {
    forceUpdate();
  }, [forceUpdate, state.storageClass]);

  const onChange = (event) => {
    const { value, unit } = event;
    const input = `${value} ${unit}`;
    setSize(value);
    dispatch({ type: 'setVolumeSize', value: input });
  };

  const substract = () => {
    if (state.numVolumes > 1) {
      dispatch({ type: 'setVolumes', value: state.numVolumes - 1 });
    }
  };

  return (
    <>
      <FormGroup
        label="Number of Volumes"
        fieldId="set-volumes"
        className="nb-bs-form-entry nb-bs-form-entry--short"
        isRequired
      >
        <InputGroup>
          <InputGroupText>
            <MinusIcon onClick={substract} />{' '}
          </InputGroupText>
          <TextInput value={state.numVolumes} aria-label="Number of Volumes" />
          <InputGroupText>
            <PlusIcon
              onClick={() => dispatch({ type: 'setVolumes', value: state.numVolumes + 1 })}
            />{' '}
          </InputGroupText>
        </InputGroup>
      </FormGroup>
      <FormGroup
        label="Volume Size"
        fieldId="volume-size"
        className="nb-bs-form-entry nb-bs-form-entry--short"
        isRequired
      >
        <RequestSizeInput
          name="Volume Size"
          onChange={onChange}
          dropdownUnits={units}
          defaultRequestSizeUnit="GiB"
          defaultRequestSizeValue={size}
        />
      </FormGroup>
      <FormGroup fieldId="storage-class" className="nb-bs-form-entry" isRequired>
        <StorageClassDropdown
          onChange={(sc) => dispatch({ type: 'setStorageClass', value: getName(sc) })}
          defaultClass="ocs-storagecluster-ceph-rbd"
          id="sc-dropdown"
          required
        />
      </FormGroup>
    </>
  );
};

const gcpHelpText = () => (
  <DashboardCardPopupLink
    linkTitle={
      <>
        <HelpIcon /> Where can I find google cloud credentials?
      </>
    }
    popupTitle=" "
  >
    <div>
      Service account keys are needed for Google Cloud Storage authentication. The keys can be found
      in the service accounts page in the GCP console.
      <ExternalLink
        href="https://cloud.google.com/iam/docs/service-accounts#service_account_keys"
        text="Learn more"
      />
    </div>
  </DashboardCardPopupLink>
);

const GCPEndpointType: React.FC<GCPEndPointTypeProps> = (props) => {
  const [fileData, setFileData] = React.useState('');
  const [inputData, setInputData] = React.useState('');
  const { dispatch } = props;

  const onUpload = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = _.get(ev, 'target.result');
      setFileData(data);
      setInputData(file.name);
      dispatch({ type: 'setGcpJSON', value: data });
    };
    reader.readAsText(file);
  };

  return (
    <>
      <FormGroup
        className="nb-bs-form-entry"
        helperText="Upload a .json file with the service account keys provided by google cloud storage."
        label="Secret Key"
        fieldId="secret-key"
      >
        <InputGroup>
          <TextInput
            isReadOnly
            value={inputData}
            className="nb-bs-form-entry__file-name"
            placeholder="Upload JSON"
            aria-label="Uploaded File Name"
          />
          <div className="inputbtn nb-bs-form-entry-upload-btn">
            <Button
              href="#"
              variant="secondary"
              className="custom-input-btn nb-bs-form-entry-upload-btn__button"
            >
              Browse
            </Button>
            <input
              type="file"
              id="inputButton"
              className="nb-bs-form-entry-upload-btn__input"
              onChange={onUpload}
              aria-label="Upload File"
            />
          </div>
        </InputGroup>
      </FormGroup>
      <FormGroup className="nb-bs-form-entry" helperText={gcpHelpText} fieldId="gcp-data">
        <TextArea
          aria-label="cluster-metadata"
          className="nb-bs-form-entry__data-dump"
          value={fileData}
        />
      </FormGroup>
    </>
  );
};

type ProviderDataState = {
  secretName: string;
  secretKey: string;
  accessKey: string;
  region: string;
  gcpJSON: string;
  target: string;
  endpoint: string;
  numVolumes: number;
  volumeSize: string;
  storageClass: string;
};

type Action =
  | { type: 'setSecretName'; value: string }
  | { type: 'setSecretKey'; value: string }
  | { type: 'setAccessKey'; value: string }
  | { type: 'setRegion'; value: string }
  | { type: 'setGcpJSON'; value: string }
  | { type: 'setTarget'; value: string }
  | { type: 'setEndpoint'; value: string }
  | { type: 'setVolumes'; value: number }
  | { type: 'setVolumeSize'; value: string }
  | { type: 'setStorageClass'; value: string };

const initialState: ProviderDataState = {
  secretName: '',
  secretKey: '',
  accessKey: '',
  region: '',
  gcpJSON: '',
  target: '',
  endpoint: '',
  numVolumes: 1,
  volumeSize: '',
  storageClass: '',
};

const providerDataReducer = (state: ProviderDataState, action: Action) => {
  const { value } = action;
  switch (action.type) {
    case 'setSecretName':
      return Object.assign({}, state, { secretName: value });
    case 'setSecretKey':
      return Object.assign({}, state, { secretKey: value });
    case 'setAccessKey':
      return Object.assign({}, state, { accessKey: value });
    case 'setRegion':
      return Object.assign({}, state, { region: value });
    case 'setGcpJSON':
      return Object.assign({}, state, { gcpJSON: value });
    case 'setTarget':
      return Object.assign({}, state, { target: value });
    case 'setEndpoint':
      return Object.assign({}, state, { endpoint: value });
    case 'setVolumes':
      return Object.assign({}, state, { numVolumes: value });
    case 'setVolumeSize':
      return Object.assign({}, state, { volumeSize: value });
    case 'setStorageClass':
      return Object.assign({}, state, { storageClass: value });
    default:
      return initialState;
  }
};

const secretPayloadCreator = (
  provider: string,
  namespace: string,
  secretName: string,
  field1: string,
  field2 = '',
) => {
  const payload = {
    apiVersion: getAPIVersion(SecretModel),
    kind: SecretModel.kind,
    stringData: {},
    metadata: {
      name: secretName,
      namespace,
    },
    type: SecretType.opaque,
  };

  switch (provider) {
    case 'Azure Blob':
      payload.stringData = {
        AccountName: field1,
        AccountKey: field2,
      };
      break;
    case 'Google cloud storage':
      payload.stringData = {
        GoogleServiceAccountPrivateKeyJson: field1,
      };
      break;
    default:
      payload.stringData = {
        AWS_ACCESS_KEY_ID: field1,
        AWS_SECRET_ACCESS_KEY: field2,
      };
      break;
  }
  return payload;
};

const CreateBackingStoreForm: React.FC<CreateBackingStoreFormProps> = withHandlePromise<
  CreateBackingStoreFormProps & HandlePromiseProps
>((props) => {
  const [namespace, setNamespace] = React.useState(props.namespace);
  const [bsName, setBsName] = React.useState('');
  const [provider, setProvider] = React.useState(providers['AWS S3']);
  const [providerDataState, providerDataDispatch] = React.useReducer(
    providerDataReducer,
    initialState,
  );
  const [disabled, setDisabled] = React.useState(true);

  // Basic validation of the form
  React.useEffect(() => {
    const secretLogic = !(
      providerDataState.target.trim().length > 0 &&
      ((providerDataState.accessKey.trim().length > 0 &&
        providerDataState.secretKey.trim().length > 0) ||
        providerDataState.secretName.length > 0)
    );
    if (namespace.length === 0 || bsName.trim().length === 0) {
      setDisabled(true);
    } else if (provider === 'AWS S3' && providerDataState.region.length === 0) {
      setDisabled(true);
    } else if (provider !== 'PVC' && secretLogic) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [bsName, namespace.length, provider, providerDataState]);

  const { cancel, className, close, inProgress, errorMessage, handlePromise, isPage } = props;

  const onSubmit = (event) => {
    event.preventDefault();
    /** Create a secret if secret ==='' */
    let { secretName } = providerDataState;
    const promises = [];
    if (!secretName) {
      secretName = bsName.concat('-secret');
      const { secretKey, accessKey, gcpJSON } = providerDataState;
      const secretPayload = secretPayloadCreator(
        provider,
        namespace,
        secretName,
        accessKey || gcpJSON,
        secretKey,
      );
      promises.push(k8sCreate(SecretModel, secretPayload));
    }
    /** Payload for bs */
    const bsPayload = {
      apiVersion: apiVersionForModel(NooBaaBackingStoreModel),
      kind: NooBaaBackingStoreModel.kind,
      metadata: {
        namespace,
        name: bsName,
      },
      spec: {
        type: typeNoobaaMap[provider],
        [providerNoobaaMap[provider]]: {
          [bucketNoobaaMap[provider]]: providerDataState.target,
          secret: {
            name: secretName,
            namespace,
          },
        },
        ssl: false,
      },
    };
    if (provider === 'AWS S3') {
      // eslint-disable-next-line
      bsPayload.spec['region'] = providerDataState.region;
    }
    promises.push(k8sCreate(NooBaaBackingStoreModel, bsPayload));
    return handlePromise(Promise.all(promises)).then((resource) => {
      const lastIndex = resource.length - 1;
      if (isPage)
        history.push(resourceObjPath(resource[lastIndex], referenceFor(resource[lastIndex])));
      else close();
    });
  };

  return (
    <Form className={classNames('nb-bs-form', className)} onSubmit={onSubmit}>
      <FormGroup label="Namespace" fieldId="namespace" className="nb-bs-form-entry" isRequired>
        <NsDropdown
          onChange={setNamespace}
          selectedKey={namespace}
          id="nb-bs-form__entry-namespace"
        />
      </FormGroup>

      <FormGroup
        label="BackingStore Name"
        fieldId="backingstore-name"
        className="nb-bs-form-entry"
        helperText="If not provided, a generic name will be generated."
      >
        <TextInput
          onChange={setBsName}
          value={bsName}
          placeholder="my-backingstore"
          aria-label="BackingStore Name"
        />
      </FormGroup>

      <FormGroup label="Provider" fieldId="provider-name" className="nb-bs-form-entry" isRequired>
        <Dropdown
          className="nb-bs-form-entry__dropdown"
          buttonClassName="nb-bs-form-entry__dropdown"
          onChange={setProvider}
          items={providers}
          selectedKey={provider}
        />
      </FormGroup>
      {provider === 'Google cloud storage' && <GCPEndpointType dispatch={providerDataDispatch} />}
      {(provider === 'AWS S3' || provider === 'S3 Compatible' || provider === 'Azure Blob') && (
        <S3EndPointType
          provider={provider}
          namespace="openshift-storage"
          state={providerDataState}
          dispatch={providerDataDispatch}
        />
      )}
      {provider === 'PVC' && <PVCType state={providerDataState} dispatch={providerDataDispatch} />}
      <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
        <ActionGroup>
          <Button type="submit" variant="primary" isDisabled={disabled}>
            Create BackingStore
          </Button>
          <Button onClick={cancel} variant="secondary">
            Cancel
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
};

type S3EndpointTypeProps = {
  state: ProviderDataState;
  dispatch: React.Dispatch<Action>;
  provider: string;
  namespace: string;
};

type PVCTypeProps = {
  state: ProviderDataState;
  dispatch: React.Dispatch<Action>;
};

type GCPEndPointTypeProps = {
  dispatch: React.Dispatch<Action>;
};
