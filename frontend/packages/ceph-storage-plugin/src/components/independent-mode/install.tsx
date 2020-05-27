import * as React from 'react';
import * as _ from 'lodash';
import { match } from 'react-router';
import {
  ButtonBar,
  withHandlePromise,
  HandlePromiseProps,
} from '@console/internal/components/utils';
import {
  k8sGet,
  k8sCreate,
  referenceForModel,
  apiVersionForModel,
} from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import {
  Title,
  FormGroup,
  Form,
  ActionGroup,
  Button,
  TextInput,
  InputGroup,
  Alert,
  TextArea,
} from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';
import { SecretModel } from '@console/internal/models';
import { getName } from '@console/shared';
import { OCSServiceModel } from '../../models';
import FileUpload from './fileUpload';
import { isValidJSON, checkError, prettifyJSON } from './utils';
import './install.scss';

const InstallExternalCluster = withHandlePromise((props: InstallExternalClusterProps) => {
  const {
    inProgress,
    errorMessage,
    handlePromise,
    match: {
      params: { ns, appName },
    },
    minRequiredKeys: { configMaps, secrets: encodedKeys, storageClasses },
    downloadFile,
  } = props;
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);
  const [fileData, setFileData] = React.useState('');
  const [dataError, setDataError] = React.useState('');

  const plainKeys = _.concat(configMaps, storageClasses);

  // File Upload handler
  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const reader = new FileReader();
    const file = event.target.files[0];
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      if (isValidJSON(data)) {
        setDataError(checkError(data, plainKeys, encodedKeys));
        setFileData(data);
      } else {
        setDataError('The uploaded file is not a valid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const onSubmit = (event) => {
    event.preventDefault();

    const secret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: 'rook-ceph-external-cluster-details',
        namespace: ns,
      },
      stringData: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        external_cluster_details: fileData,
      },
      type: 'Opaque',
    };

    const ocsObj = {
      apiVersion: apiVersionForModel(OCSServiceModel),
      kind: OCSServiceModel.kind,
      metadata: {
        name: 'ocs-independent-storagecluster',
        namespace: ns,
      },
      spec: {
        externalStorage: {
          enable: true,
        },
      },
    };

    handlePromise(Promise.all([k8sCreate(SecretModel, secret), k8sCreate(OCSServiceModel, ocsObj)]))
      .then((data) => {
        history.push(
          `/k8s/ns/${ns}/clusterserviceversions/${getName(
            clusterServiceVersion,
          )}/${referenceForModel(OCSServiceModel)}/${getName(data[data.length - 1])}`,
        );
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error(e);
      });
  };

  const onCancel = () => {
    history.goBack();
  };

  React.useEffect(() => {
    k8sGet(ClusterServiceVersionModel, appName, ns)
      .then((clusterServiceVersionObj) => {
        setClusterServiceVersion(clusterServiceVersionObj);
      })
      .catch(() => setClusterServiceVersion(null));
  }, [appName, ns]);

  return (
    <>
      <div className="im-install-page">
        <div className="im-install-page__sub-header">
          <Title size="lg" headingLevel="h5" className="nb-bs-page-title__main">
            <div className="im-install-page-sub-header__title">Connect to external cluster</div>
          </Title>
          <p className="im--light im-install-page--margin-top">
            Download <code>ceph-external-cluster-details-exporter.py</code> script and run on the
            RHCS cluster, then upload the results(JSON) in the External cluster metadata field.{' '}
            {downloadFile && (
              <a
                id="downloadAnchorElem"
                href={downloadFile}
                download="ceph-external-cluster-details-exporter.py"
                target="_blank"
                rel="noopener noreferrer"
                className=""
              >
                Download Script
              </a>
            )}
          </p>
          <Alert
            className="co-alert"
            variant="info"
            title="A bucket will be created to provide the OCS Service."
            aria-label="Bucket created for OCS Service"
            isInline
          />
        </div>
        <Form
          className="im-install-page__form"
          onSubmit={onSubmit}
          aria-label="Create External Storage Cluster"
        >
          <FormGroup label="External cluster metadata" isRequired fieldId="cluster-metadata">
            <InputGroup>
              <TextInput
                aria-label="Upload JSON File"
                value="Upload Credentials file"
                className="im-install-page__input-box"
                isDisabled
              />
              <FileUpload onUpload={onUpload} />
            </InputGroup>
          </FormGroup>
          <FormGroup fieldId="preview-box">
            <TextArea
              value={prettifyJSON(fileData)}
              className="im-install-page__text-box"
              isValid={!dataError}
              aria-label="JSON data"
              disabled
            />
          </FormGroup>
          <ButtonBar errorMessage={dataError || errorMessage} inProgress={inProgress}>
            <ActionGroup>
              <Button
                type="submit"
                variant="primary"
                isDisabled={_.isEmpty(fileData) || !_.isEmpty(dataError)}
                aria-label="Create Button"
              >
                Create
              </Button>
              <Button onClick={onCancel} variant="secondary" aria-label="Cancel">
                Cancel
              </Button>
            </ActionGroup>
          </ButtonBar>
        </Form>
      </div>
    </>
  );
});

type InstallExternalClusterProps = HandlePromiseProps & {
  match: match<{ ns?: string; appName?: string }>;
  minRequiredKeys?: { [key: string]: string[] };
  downloadFile: string;
};

export default InstallExternalCluster;
