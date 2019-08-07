import * as React from 'react';
import * as _ from 'lodash-es';
import { safeLoad } from 'js-yaml';
import { Base64 } from 'js-base64';

import { K8sResourceKind } from '../../module/k8s';
import { LoadingBox, SectionHeading, StatusBox } from '../utils';
import { createAlertRoutingModal } from '../modals';

const AlertRouting: React.FC<AlertRoutingProps> = ({config, secret}) => {
  return <React.Fragment>
    <SectionHeading text="Alert Routing">
      <button className="btn btn-default btn-edit-alert-routing"
        onClick={() => createAlertRoutingModal({config, secret})}>Edit</button>
    </SectionHeading>
    <div className="row">
      <div className="col-sm-6">
        <dt>Group By</dt>
        <dd>{_.join(_.get(config, ['route', 'group_by']), ', ')}</dd>
        <dt>Group Wait</dt>
        <dd>{_.get(config, ['route', 'group_wait'])}</dd>
      </div>
      <div className="col-sm-6">
        <dl className="co-m-pane__details">
          <dt>Group Interval</dt>
          <dd>{_.get(config, ['route', 'group_interval'])}</dd>
          <dt>Repeat Interval</dt>
          <dd>{_.get(config, ['route', 'repeat_interval'])}</dd>
        </dl>
      </div>
    </div>
  </React.Fragment>;
};

const AlertManagerConfiguration: React.FC<AlertManagerConfigurationProps> = ({obj: secret}) => {
  const alertManagerYaml = _.get(secret, ['data', 'alertmanager.yaml']);
  let errorMsg = _.isEmpty(alertManagerYaml) ? 'Error: alertmanager.yaml not found in Secret "alertmanager-main", in namespace "openshift-monitoring"' : null;
  let yamlStringData;
  let config;

  if (!errorMsg) {
    yamlStringData = Base64.decode(alertManagerYaml);
    try {
      config = safeLoad(yamlStringData);
    } catch (e) {
      errorMsg = `Error parsing YAML: ${e}`;
    }
  }

  return <div className="co-m-pane__body">
    {errorMsg && <span>`Error: ${errorMsg}`</span>}
    {config && <AlertRouting secret={secret} config={config} />}
  </div>;
};

export const AlertManagerConfigWrapper: React.FC<AlertManagerConfigWrapperProps> = React.memo(({obj, ...props}) => {
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
    <AlertManagerConfiguration {...props} obj={obj.data} />
  </StatusBox>;
});

type AlertManagerConfigWrapperProps = {
  obj?: {
    data?: K8sResourceKind;
    [key: string]: any;
  };
};

type AlertManagerConfigurationProps = {
  obj?: K8sResourceKind;
  onCancel?: () => void;
};

type AlertRoutingProps = {
  config: any;
  secret: K8sResourceKind;
};
