import { useTranslation } from 'react-i18next';
import * as React from 'react';
import * as _ from 'lodash';
import {
  Button,
  FormGroup,
  TextInput,
  InputGroup,
  TextArea,
  PopoverPosition,
  Popover,
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { ExternalLink, Firehose } from '@console/internal/components/utils';
import { ResourceDropdown } from '@console/shared';
import { SecretModel } from '@console/internal/models';
import {
  BackingStoreProviderDataState,
  BackingStoreAction,
} from '../create-backingstore-page/reducer';
import './noobaa-provider-endpoints.scss';

type GCPEndPointTypeProps = {
  state: BackingStoreProviderDataState;
  dispatch: React.Dispatch<BackingStoreAction>;
  namespace: string;
};

export const GCPEndpointType: React.FC<GCPEndPointTypeProps> = (props) => {
  const { t } = useTranslation();

  const [fileData, setFileData] = React.useState('');
  const [inputData, setInputData] = React.useState('');
  const [showSecret, setShowSecret] = React.useState(false);
  const { state, dispatch, namespace } = props;

  const resources = [
    {
      isList: true,
      namespace,
      kind: SecretModel.kind,
      prop: 'secrets',
    },
  ];

  const toggleShowSecret = () => setShowSecret((isShown) => !isShown);

  const gcpHelpText = (
    <Popover
      position={PopoverPosition.top}
      headerContent=" "
      bodyContent={
        <div>
          {t(
            'ceph-storage-plugin~Service account keys are needed for Google Cloud Storage authentication. The keys can be found in the service accounts page in the GCP console.',
          )}
          <ExternalLink
            href="https://cloud.google.com/iam/docs/service-accounts#service_account_keys"
            text={t('ceph-storage-plugin~Learn more')}
          />
        </div>
      }
      enableFlip
      maxWidth="21rem"
    >
      <Button variant="link">
        <HelpIcon />
        {t('ceph-storage-plugin~Where can I find Google Cloud credentials?')}
      </Button>
    </Popover>
  );

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
        className="nb-endpoints-form-entry"
        helperText={
          !showSecret
            ? t(
                'ceph-storage-plugin~Upload a .json file with the service account keys provided by Google Cloud Storage.',
              )
            : null
        }
        label={t('ceph-storage-plugin~Secret Key')}
        fieldId="secret-key"
        isRequired
      >
        {!showSecret ? (
          <InputGroup>
            <TextInput
              isReadOnly
              value={inputData}
              className="nb-endpoints-form-entry__file-name"
              placeholder={t('ceph-storage-plugin~Upload JSON')}
              aria-label={t('ceph-storage-plugin~Uploaded File Name')}
            />
            <div className="inputbtn nb-endpoints-form-entry-upload-btn">
              <Button
                href="#"
                variant="secondary"
                className="custom-input-btn nb-endpoints-form-entry-upload-btn__button"
                aria-label={t('ceph-storage-plugin~Upload File')}
              >
                {t('ceph-storage-plugin~Browse')}
              </Button>
              <input
                type="file"
                id="inputButton"
                className="nb-endpoints-form-entry-upload-btn__input"
                onChange={onUpload}
                aria-label={t('ceph-storage-plugin~Upload File')}
              />
            </div>
            <Button
              variant="plain"
              onClick={toggleShowSecret}
              aria-label={t('ceph-storage-plugin~Switch to Secret')}
            >
              {t('ceph-storage-plugin~Switch to Secret')}
            </Button>
          </InputGroup>
        ) : (
          <InputGroup>
            <Firehose resources={resources}>
              <ResourceDropdown
                selectedKey={state.secretName}
                placeholder={t('ceph-storage-plugin~Select Secret')}
                className="nb-endpoints-form-entry__dropdown nb-endpoints-form-entry__dropdown--full-width"
                buttonClassName="nb-endpoints-form-entry__dropdown"
                dataSelector={['metadata', 'name']}
                ariaLabel={t('ceph-storage-plugin~Select Secret')}
                onChange={(e) => dispatch({ type: 'setSecretName', value: e })}
              />
            </Firehose>
            <Button
              variant="plain"
              onClick={toggleShowSecret}
              aria-label={t('ceph-storage-plugin~Switch to upload JSON')}
            >
              {t('ceph-storage-plugin~Switch to upload JSON')}
            </Button>
          </InputGroup>
        )}
      </FormGroup>
      {!showSecret && (
        <FormGroup className="nb-endpoints-form-entry" helperText={gcpHelpText} fieldId="gcp-data">
          <TextArea
            aria-label={t('ceph-storage-plugin~Cluster Metadata')}
            className="nb-endpoints-form-entry__data-dump"
            value={fileData}
          />
        </FormGroup>
      )}
      <FormGroup
        className="nb-endpoints-form-entry"
        label={t('ceph-storage-plugin~Target Bucket')}
        fieldId="target-bucket"
        isRequired
      >
        <TextInput
          value={state.target}
          onChange={(e) => {
            dispatch({ type: 'setTarget', value: e });
          }}
          aria-label={t('ceph-storage-plugin~Target Bucket')}
        />
      </FormGroup>
    </>
  );
};
