import * as React from 'react';
import * as _ from 'lodash-es';

import {Base64} from 'js-base64';
import {k8sPatch, K8sResourceKind} from '../../module/k8s';
import {SecretModel} from '../../models';
import {ButtonBar, history, LoadingBox, StatusBox} from '../utils';
import {AsyncComponent} from '../utils/async';

const DroppableFileInput = (props) => <AsyncComponent loader={() => import('../utils/file-input').then(c => c.DroppableFileInput)} {...props} />;

const AlertManagerYAMLEditor: React.FC<AlertManagerYAMLEditorProps> = ({obj, onCancel=history.goBack}) => {
  const secret:K8sResourceKind = obj;
  const alertManagerYaml = _.get(secret, ['data', 'alertmanager.yaml']);
  const initErrorMsg = _.isEmpty(alertManagerYaml) ? 'Error: alertmanager.yaml not found in Secret "alertmanager-main", in namespace "openshift-monitoring"' : null;

  const [errorMsg, setErrorMsg] = React.useState(initErrorMsg);
  const [successMsg, setSuccessMsg] = React.useState();
  const [inProgress, setInProgress] = React.useState(false);
  const [yamlStringData, setYamlStringData] = React.useState(!_.isEmpty(alertManagerYaml) ? Base64.decode(alertManagerYaml): '');

  const save = e => {
    e.preventDefault();
    setInProgress(true);
    const patch = [{ op: 'replace', path: '/data/alertmanager.yaml', value:  Base64.encode(yamlStringData)}];
    k8sPatch(SecretModel, secret, patch)
      .then(newSecret => {
        setSuccessMsg(`${newSecret.metadata.name} has been updated to version ${newSecret.metadata.resourceVersion}`);
        setErrorMsg('');
        setInProgress(false);
      }, err => {
        setErrorMsg(err.message);
        setSuccessMsg('');
        setInProgress(false);
      });
  };

  return <div className="co-m-pane__body">
    <form
      className="co-m-pane__body-group co-alert-manager-yaml-form co-m-pane__form"
      onSubmit={save}
    >
      <p className="co-alert-manager-yaml__explanation">
        Update this YAML to configure Routes, Receivers, Groupings and other Alert Manager settings
      </p>
      {!_.isEmpty(yamlStringData) && <div className="co-alert-manager-yaml__form-entry-wrapper">
        <div className="co-alert-manager-yaml__form">
          <div className="form-group">
            <DroppableFileInput
              onChange={setYamlStringData}
              inputFileData={yamlStringData}
              inputFieldHelpText="Drag and drop file with your value here or browse to upload it." />
          </div>
        </div>
      </div>
      }
      <ButtonBar errorMessage={errorMsg} successMessage={successMsg} inProgress={inProgress}>
        {!_.isEmpty(yamlStringData) && <button type="submit" className="btn btn-primary" id="save-changes">
          Save
        </button> }
        <button type="button" className="btn btn-default" id="cancel" onClick={onCancel}>
          Cancel
        </button>
      </ButtonBar>
    </form>
  </div>;
};

export const AlertManagerYAMLEditorWrapper: React.FC<AlertManagerYAMLEditorWrapperProps> = React.memo(({obj, ...props}) => {
  const [inProgress, setInProgress] = React.useState(true);

  React.useEffect(() => {
    if (inProgress && !_.isEmpty(obj.data)) {
      setInProgress(false);
    }
  }, [inProgress, obj.data]);

  if (inProgress) {
    return <LoadingBox />;
  }

  return <StatusBox {...obj}>
    <AlertManagerYAMLEditor {...props} obj={obj.data} />
  </StatusBox>;
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
