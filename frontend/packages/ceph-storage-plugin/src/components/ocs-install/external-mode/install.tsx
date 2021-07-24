import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import { match } from 'react-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import {
  ButtonBar,
  withHandlePromise,
  HandlePromiseProps,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import {
  k8sGet,
  k8sCreate,
  referenceForModel,
  apiVersionForModel,
  k8sList,
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
import { SecretModel, PodModel } from '@console/internal/models';
import { setFlag } from '@console/internal/actions/features';
import { getName } from '@console/shared';
import FileUpload from './fileUpload';
import { isValidJSON, checkError, prettifyJSON, getIPFamily } from './utils';
import { OCSServiceModel } from '../../../models';
import { OCS_INDEPENDENT_FLAG, OCS_FLAG, OCS_CONVERGED_FLAG } from '../../../features';
import { OCS_EXTERNAL_CR_NAME, IP_FAMILY } from '../../../constants';
import { labelOCSNamespace } from '../ocs-request-data';
import './install.scss';

const CreateExternalCluster = withHandlePromise((props: CreateExternalClusterProps) => {
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
  const { t } = useTranslation();

  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);
  const [fileData, setFileData] = React.useState('');
  const [dataError, setDataError] = React.useState('');
  const [ipFamily, setIPFamily] = React.useState(IP_FAMILY.IPV4);
  const dispatch = useDispatch();

  const plainKeys = _.concat(configMaps, storageClasses);

  const SCRIPT_NAME = 'ceph-external-cluster-details-exporter.py';

  React.useEffect(() => {
    // eslint-disable-next-line promise/catch-or-return
    k8sList(PodModel).then((pods) => {
      const address = pods[0].status.podIP;
      setIPFamily(getIPFamily(address));
    });
  }, []);

  // File Upload handler
  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const reader = new FileReader();
    const file = event.target.files[0];
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      if (isValidJSON(data)) {
        setDataError(checkError(data, plainKeys, encodedKeys, ipFamily));
        setFileData(data);
      } else {
        setDataError(t('ceph-storage-plugin~The uploaded file is not a valid JSON file'));
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
        name: OCS_EXTERNAL_CR_NAME,
        namespace: ns,
      },
      spec: {
        externalStorage: {
          enable: true,
        },
        labelSelector: {
          matchExpressions: [],
        },
      },
    };

    handlePromise(
      Promise.all([
        labelOCSNamespace(),
        k8sCreate(SecretModel, secret),
        k8sCreate(OCSServiceModel, ocsObj),
      ]),
      (data) => {
        dispatch(setFlag(OCS_INDEPENDENT_FLAG, true));
        dispatch(setFlag(OCS_CONVERGED_FLAG, false));
        dispatch(setFlag(OCS_FLAG, true));
        history.push(
          `/k8s/ns/${ns}/clusterserviceversions/${getName(
            clusterServiceVersion,
          )}/${referenceForModel(OCSServiceModel)}/${getName(data[data.length - 1])}`,
        );
      },
    );
  };

  const onCancel = () =>
    history.push(resourcePathFromModel(ClusterServiceVersionModel, appName, ns));

  React.useEffect(() => {
    k8sGet(ClusterServiceVersionModel, appName, ns)
      .then((clusterServiceVersionObj) => {
        setClusterServiceVersion(clusterServiceVersionObj);
      })
      .catch(() => setClusterServiceVersion(null));
  }, [appName, ns]);

  return (
    <>
      <div className="im-install-page co-m-pane__body co-m-pane__form">
        <div className="im-install-page__sub-header">
          <Title size="lg" headingLevel="h5" className="nb-bs-page-title__main">
            <div className="im-install-page-sub-header__title">
              {t('ceph-storage-plugin~Connect to external cluster')}
            </div>
          </Title>
          <p className="im--light im-install-page--margin-top">
            <Trans t={t} ns="ceph-storage-plugin">
              Download <code>{{ SCRIPT_NAME }}</code> script and run on the RHCS cluster, then
              upload the results (JSON) in the External cluster metadata field.
            </Trans>{' '}
            {downloadFile && (
              <a
                id="downloadAnchorElem"
                href={downloadFile}
                download="ceph-external-cluster-details-exporter.py"
                target="_blank"
                rel="noopener noreferrer"
                className=""
              >
                {t('ceph-storage-plugin~Download Script')}
              </a>
            )}
          </p>
          <Alert
            className="co-alert"
            variant="info"
            title={t(
              "ceph-storage-plugin~A bucket will be created to provide the OpenShift Data Foundation's Service.",
            )}
            role="alert"
            aria-label={t(
              "ceph-storage-plugin~Bucket created for OpenShift Container Storage's Service",
            )}
            isInline
          />
        </div>
        <Form
          className="im-install-page__form"
          onSubmit={onSubmit}
          aria-label={t('ceph-storage-plugin~Create External StorageCluster')}
        >
          <FormGroup
            label={t('ceph-storage-plugin~External cluster metadata')}
            isRequired
            fieldId="cluster-metadata"
          >
            <InputGroup>
              <TextInput
                aria-label={t('ceph-storage-plugin~Upload JSON File')}
                value={t('ceph-storage-plugin~Upload Credentials file') as string}
                className="im-install-page__input-box"
                isDisabled
              />
              <FileUpload role="button" onUpload={onUpload} />
            </InputGroup>
          </FormGroup>
          <FormGroup fieldId="preview-box">
            <TextArea
              value={prettifyJSON(fileData)}
              className="im-install-page__text-box"
              validated={!dataError ? 'default' : 'error'}
              aria-label={t('ceph-storage-plugin~JSON data')}
              disabled
            />
          </FormGroup>
          <ButtonBar errorMessage={dataError || errorMessage} inProgress={inProgress}>
            <ActionGroup>
              <Button
                type="submit"
                variant="primary"
                isDisabled={_.isEmpty(fileData) || !_.isEmpty(dataError)}
                aria-label={t('ceph-storage-plugin~Create Button')}
              >
                {t('ceph-storage-plugin~Create')}
              </Button>
              <Button
                onClick={onCancel}
                variant="secondary"
                aria-label={t('ceph-storage-plugin~Cancel')}
              >
                {t('ceph-storage-plugin~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </Form>
      </div>
    </>
  );
});

type CreateExternalClusterProps = HandlePromiseProps & {
  match: match<{ ns?: string; appName?: string }>;
  minRequiredKeys?: { [key: string]: string[] };
  downloadFile: string;
};

export default CreateExternalCluster;
