import * as React from 'react';
import * as _ from 'lodash';
import { match } from 'react-router';
import {
  ButtonBar,
  withHandlePromise,
  HandlePromiseProps,
} from '@console/internal/components/utils';
import { k8sGet, k8sCreate, referenceForModel } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { Title, FormGroup, Form, ActionGroup, Button, TextInput } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';
import { SecretModel, ConfigMapModel } from '@console/internal/models';
import { getName } from '@console/shared';
import { OCSServiceModel } from '../../models';
import FileUpload from './fileUpload';
import { DataState, ErrorType, Field } from './types';
import { getValidJSON, checkError } from './utils';
import './install.scss';

const ERROR: DataState = {
  clusterName: '',
  fsid: '',
  admin: '',
  monData: '',
};

const getErrorText = (text: string) => <span className="im-install-page--error">{text}</span>;

const InstallExternalCluster = withHandlePromise((props: InstallExternalClusterProps) => {
  const {
    inProgress,
    errorMessage,
    handlePromise,
    match: {
      params: { ns, appName },
    },
  } = props;
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);
  const [fileData, setFileData] = React.useState('');
  const [clusterName, setClusterName] = React.useState(null);
  const [externalFSID, setExternalFSID] = React.useState(null);
  const [externalAdminSecret, setExternalAdminSecret] = React.useState(null);
  const [externalMonData, setExternalMonData] = React.useState(null);
  const [dataError, setDataError] = React.useState(ERROR);
  const [fileError, setFileError] = React.useState('');
  const [, updateState] = React.useState();

  // Todo(bipuladh): React does shallow comparison dataError and fileError need deep comparison.
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const setErrors = React.useCallback((errors: ErrorType[]): void => {
    for (const err of errors) {
      setDataError(Object.assign(ERROR, { [err.field]: err.message }));
    }
  }, []);

  const getState = React.useCallback(
    () => ({
      [Field.CLUSTER_NAME]: clusterName,
      [Field.FSID]: externalFSID,
      [Field.ADMIN]: externalAdminSecret,
      [Field.MONDATA]: externalMonData,
    }),
    [externalAdminSecret, externalFSID, externalMonData, clusterName],
  );

  React.useEffect(() => {
    setErrors(checkError(getState()));
  }, [getState, setErrors]);

  // File Upload handler
  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const reader = new FileReader();
    const file = event.target.files[0];
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setFileData(data);
    };
    reader.readAsText(file);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    // https://github.com/rook/rook/blob/master/cluster/examples/kubernetes/ceph/import-external-cluster.sh
    const secret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: 'rook-ceph-mon',
        ns,
      },
      stringData: {
        'cluster-name': clusterName,
        fsid: externalFSID,
        'admin-secret': externalAdminSecret,
      },
      type: 'Opaque',
    };
    const cmap = {
      apiVersion: ConfigMapModel.apiVersion,
      kind: ConfigMapModel.kind,
      metadata: {
        name: 'rook-ceph-mon-endpoints',
        ns,
      },
      data: {
        data: `${externalMonData}`,
        mapping: '{}',
        maxMonId: '2',
      },
    };
    const ocsObj = {
      apiVersion: 'ocs.openshift.io/v1',
      kind: OCSServiceModel.kind,
      metadata: {
        name: 'ocs-independent-storagecluster',
        ns,
      },
      spec: {
        externalStorage: {
          enabled: true,
        },
      },
    };

    handlePromise(
      Promise.all([
        k8sCreate(SecretModel, secret),
        k8sCreate(ConfigMapModel, cmap),
        k8sCreate(OCSServiceModel, ocsObj),
      ]),
    )
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

  const mapValidDataToState = (json: DataState) => {
    const { clusterName: clusterName_, fsid, admin, monData } = json;
    setClusterName(clusterName_);
    setExternalFSID(fsid);
    setExternalAdminSecret(admin);
    setExternalMonData(monData);
  };

  const validate = React.useCallback(() => {
    if (!_.isEmpty(fileData)) {
      const data = getValidJSON(fileData);
      if (data.isValid) {
        mapValidDataToState(data.parsedData);
        setFileError(null);
      } else {
        setFileError(data.errorMessage);
      }
    }
    setErrors(checkError(getState()));
  }, [fileData, getState, setErrors]);

  // File Data validator
  React.useEffect(() => {
    validate();
    forceUpdate();
  }, [validate, setFileData, forceUpdate]);

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
            <div className="im-install-page-sub-header__title">
              Connect to external cluster
              <FileUpload onUpload={onUpload} />
            </div>
          </Title>
          <p className="im--light">
            Run &lsaquo;utility-name&rsaquo; to obtain metadata needed for connecting to the
            external cluster.
          </p>
        </div>
        <Form className="im-install-page__form" onSubmit={onSubmit}>
          <FormGroup
            label="Cluster Name"
            isRequired
            fieldId="namespace-dropdown"
            helperText={getErrorText(dataError.clusterName)}
          >
            <TextInput
              onChange={(val) => setClusterName(val)}
              value={clusterName}
              aria-label="Enter Cluster name"
              placeholder="openshift-storage"
            />
          </FormGroup>
          <FormGroup
            label="External FSID"
            isRequired
            fieldId="ext-fsid"
            helperText={getErrorText(dataError.fsid)}
          >
            <TextInput
              onChange={(val) => setExternalFSID(val)}
              value={externalFSID ?? ''}
              aria-label="Enter External FSID"
              placeholder="asdf-ghjk-qwer-tyui"
            />
          </FormGroup>
          <FormGroup
            label="External admin secret"
            isRequired
            fieldId="ext-admin"
            helperText={getErrorText(dataError.admin)}
          >
            <TextInput
              onChange={(val) => setExternalAdminSecret(val)}
              value={externalAdminSecret ?? ''}
              aria-label="Enter Admin secret"
              placeholder="!123jakajs==djjzla2"
            />
          </FormGroup>
          <FormGroup
            label="External mon data"
            isRequired
            fieldId="ext-mon-data"
            helperText={getErrorText(dataError.monData)}
          >
            <TextInput
              onChange={(val) => setExternalMonData(val)}
              value={externalMonData ?? ''}
              aria-label="Enter Mon Data"
              placeholder="a='12.22.123.22'"
            />
          </FormGroup>

          <ButtonBar errorMessage={fileError || errorMessage} inProgress={inProgress}>
            <ActionGroup>
              <Button type="submit" variant="primary">
                Create
              </Button>
              <Button onClick={onCancel} variant="secondary">
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
};

export default InstallExternalCluster;
