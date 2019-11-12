import * as React from 'react';
import * as _ from 'lodash-es';
import { ActionGroup, Button } from '@patternfly/react-core';

import { Base64 } from 'js-base64';
import { K8sResourceKind } from '../../module/k8s';
import { ButtonBar, history, StatusBox } from '../utils';
import { AsyncComponent } from '../utils/async';
import { patchAlertManagerConfig } from './alert-manager-utils';
import { Helmet } from 'react-helmet';

const DroppableFileInput = (props) => (
  <AsyncComponent
    loader={() => import('../utils/file-input').then((c) => c.DroppableFileInput)}
    {...props}
  />
);

const AlertManagerYAMLEditor: React.FC<AlertManagerYAMLEditorProps> = ({
  obj,
  onCancel = history.goBack,
}) => {
  const secret: K8sResourceKind = obj;
  const encodedAlertManagerYaml = _.get(secret, ['data', 'alertmanager.yaml']);
  const initErrorMsg = _.isEmpty(encodedAlertManagerYaml)
    ? 'Error: alertmanager.yaml not found in Secret "alertmanager-main", in namespace "openshift-monitoring"'
    : null;

  const [errorMsg, setErrorMsg] = React.useState(initErrorMsg);
  const [successMsg, setSuccessMsg] = React.useState();
  const [inProgress, setInProgress] = React.useState(false);
  const [alertManagerYamlStr, setAlertManagerYamlStr] = React.useState(
    !_.isEmpty(encodedAlertManagerYaml) ? Base64.decode(encodedAlertManagerYaml) : '',
  );

  const save = (e) => {
    e.preventDefault();
    if (_.isEmpty(alertManagerYamlStr)) {
      setErrorMsg('Alertmanager configuration cannot be empty.');
      setSuccessMsg('');
      return;
    }
    setInProgress(true);
    patchAlertManagerConfig(secret, alertManagerYamlStr).then(
      (newSecret) => {
        setSuccessMsg(
          `${newSecret.metadata.name} has been updated to version ${
            newSecret.metadata.resourceVersion
          }`,
        );
        setErrorMsg('');
        setInProgress(false);
      },
      (err) => {
        setErrorMsg(err.message);
        setSuccessMsg('');
        setInProgress(false);
      },
    );
  };

  return (
    <div className="co-m-pane__body">
      <form
        className="co-m-pane__body-group co-alert-manager-yaml-form co-m-pane__form"
        onSubmit={save}
      >
        <p className="co-alert-manager-yaml__explanation">
          Update this YAML to configure Routes, Receivers, Groupings and other Alertmanager settings
        </p>
        <div className="co-alert-manager-yaml__form-entry-wrapper">
          <div className="co-alert-manager-yaml__form">
            <div className="form-group">
              <DroppableFileInput
                onChange={setAlertManagerYamlStr}
                inputFileData={alertManagerYamlStr}
                inputFieldHelpText="Drag and drop file with your value here or browse to upload it."
              />
            </div>
          </div>
        </div>
        <ButtonBar errorMessage={errorMsg} successMessage={successMsg} inProgress={inProgress}>
          <ActionGroup className="pf-c-form">
            <Button type="submit" variant="primary" id="save-changes">
              Save
            </Button>
            <Button type="button" variant="secondary" id="cancel" onClick={onCancel}>
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </form>
    </div>
  );
};

export const AlertManagerYAMLEditorWrapper: React.FC<
  AlertManagerYAMLEditorWrapperProps
> = React.memo(({ obj, ...props }) => {
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
});

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
