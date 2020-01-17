import * as React from 'react';
import * as _ from 'lodash-es';
import { Alert } from '@patternfly/react-core';
import { Base64 } from 'js-base64';
import { safeLoad } from 'js-yaml';

import { K8sResourceKind } from '../../module/k8s';
import { StatusBox } from '../utils';
import { AsyncComponent } from '../utils/async';
import { patchAlertManagerConfig } from './alert-manager-utils';
import { Helmet } from 'react-helmet';

const EditAlertmanagerYAML = (props) => (
  <AsyncComponent
    {...props}
    loader={() => import('../edit-yaml').then((c) => c.EditYAML)}
    create={false}
    genericYAML
  />
);

const AlertManagerYAMLEditor: React.FC<AlertManagerYAMLEditorProps> = ({ obj }) => {
  const secret: K8sResourceKind = obj;
  const encodedAlertManagerYaml = _.get(secret, ['data', 'alertmanager.yaml']);
  const initErrorMsg = _.isEmpty(encodedAlertManagerYaml)
    ? 'Error: alertmanager.yaml not found in Secret "alertmanager-main", in namespace "openshift-monitoring"'
    : null;

  const [errorMsg, setErrorMsg] = React.useState(initErrorMsg);
  const [successMsg, setSuccessMsg] = React.useState();
  const alertManagerYamlStr = !_.isEmpty(encodedAlertManagerYaml)
    ? Base64.decode(encodedAlertManagerYaml)
    : '';

  const save = (yaml: string) => {
    if (_.isEmpty(yaml)) {
      setErrorMsg('Alertmanager configuration cannot be empty.');
      setSuccessMsg('');
      return;
    }
    try {
      safeLoad(yaml);
    } catch (e) {
      setErrorMsg(`Error parsing Alertmanager YAML: ${e}`);
      setSuccessMsg('');
      return;
    }
    patchAlertManagerConfig(secret, yaml).then(
      (newSecret) => {
        setSuccessMsg(
          `${newSecret.metadata.name} has been updated to version ${newSecret.metadata.resourceVersion}`,
        );
        setErrorMsg('');
      },
      (err) => {
        setErrorMsg(err.message);
        setSuccessMsg('');
      },
    );
  };

  return (
    <>
      <div className="co-m-nav-title">
        <p className="help-block">
          Update this YAML to configure Routes, Receivers, Groupings and other Alertmanager
          settings.
        </p>
      </div>
      <EditAlertmanagerYAML onSave={save} obj={alertManagerYamlStr}>
        {errorMsg && (
          <Alert
            isInline
            className="co-alert co-alert--scrollable"
            variant="danger"
            title="An error occurred"
          >
            <div className="co-pre-line">{errorMsg}</div>
          </Alert>
        )}
        {successMsg && <Alert isInline className="co-alert" variant="success" title={successMsg} />}
      </EditAlertmanagerYAML>
    </>
  );
};

export const AlertManagerYAMLEditorWrapper: React.FC<AlertManagerYAMLEditorWrapperProps> = React.memo(
  ({ obj, ...props }) => {
    return (
      <>
        <Helmet>
          <title>Alerting</title>
        </Helmet>
        <StatusBox {...obj}>
          <AlertManagerYAMLEditor {...props} obj={obj.data} />
        </StatusBox>
      </>
    );
  },
);

type AlertManagerYAMLEditorWrapperProps = {
  obj?: {
    data?: K8sResourceKind;
    [key: string]: any;
  };
};

type AlertManagerYAMLEditorProps = {
  obj?: K8sResourceKind;
  onCancel?: () => void;
};
