import * as React from 'react';
import * as _ from 'lodash';
import { match } from 'react-router';
import {
  ButtonBar,
  NsDropdown,
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
  ns: '',
  fsid: '',
  admin: '',
  mondata: '',
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
  const [fileName, setFileName] = React.useState('');
  const [namespace, setNamespace] = React.useState(ns);
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
      [Field.NAMESPACE]: namespace,
      [Field.FSID]: externalFSID,
      [Field.ADMIN]: externalAdminSecret,
      [Field.MONDATA]: externalMonData,
    }),
    [externalAdminSecret, externalFSID, externalMonData, namespace],
  );

  React.useEffect(() => {
    setErrors(checkError(getState()));
  }, [getState, setErrors]);

  // File Upload handler
  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const reader = new FileReader();
    const file = event.target.files[0];
    setFileName(file.name);
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setFileData(data);
    };
    reader.readAsText(file);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    // https://github.com/rook/rook/blob/master/cluster/examples/kubernetes/ceph/import-external-cluster.sh
    const promises = [];
    const secret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: 'rook-ceph-mon',
        namespace,
      },
      stringData: {
        'cluster-name': namespace,
        fsid: externalFSID,
        'admin-secret': externalAdminSecret,
        'mon-secret': externalMonData,
      },
      type: 'Opaque',
    };
    const cmap = {
      apiVersion: ConfigMapModel.apiVersion,
      kind: ConfigMapModel.kind,
      metadata: {
        name: 'rook-ceph-mon-endpoints',
        namespace,
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
        namespace,
      },
      spec: {
        external: {
          enable: true,
        },
      },
    };
    promises.push(k8sCreate(SecretModel, secret));
    promises.push(k8sCreate(ConfigMapModel, cmap));
    promises.push(k8sCreate(OCSServiceModel, ocsObj));

    handlePromise(Promise.all(promises))
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
    const { ns: ns_, fsid, admin, mondata } = json;
    setNamespace(ns_);
    setExternalFSID(fsid);
    setExternalAdminSecret(admin);
    setExternalMonData(mondata);
  };

  const validate = React.useCallback(() => {
    if (!_.isEmpty(fileName) && !_.isEmpty(fileData)) {
      const data = getValidJSON(fileName, fileData);
      !data.isValid ? setFileError(data.errorMessage) : mapValidDataToState(data.parsedData);
    }
    setErrors(checkError(getState()));
  }, [fileData, fileName, getState, setErrors]);

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
            label="Namespace"
            isRequired
            fieldId="namespace-dropdown"
            helperText={dataError.ns}
          >
            <NsDropdown onChange={setNamespace} selectedKey={namespace} />
          </FormGroup>
          <FormGroup
            label="External FSID"
            isRequired
            fieldId="ext-fsid"
            helperText={getErrorText(dataError.fsid)}
          >
            <TextInput onChange={(val) => setExternalFSID(val)} value={externalFSID} />
          </FormGroup>
          <FormGroup
            label="External admin secret"
            isRequired
            fieldId="ext-admin"
            helperText={getErrorText(dataError.admin)}
          >
            <TextInput
              onChange={(val) => setExternalAdminSecret(val)}
              value={externalAdminSecret}
            />
          </FormGroup>
          <FormGroup
            label="External mon data"
            isRequired
            fieldId="ext-mon-data"
            helperText={getErrorText(dataError.mondata)}
          >
            <TextInput onChange={(val) => setExternalMonData(val)} value={externalMonData} />
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
