import * as _ from 'lodash';
import * as React from 'react';
import { safeLoad, safeDump } from 'js-yaml';
import { Field, reduxForm, getFormValues } from 'redux-form';

import store from '../../redux';
import { k8sPatch, k8sKinds } from '../../module/k8s';
import { Firehose, StatusBox, PromiseComponent } from '../utils';
import { AlertManagersListContainer } from '../alert-manager';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';


const empty = 'none';

class PromSettingsModal extends PromiseComponent {
  _submit (e) {
    e.preventDefault();

    const { path, Form, obj, cancel} = this.props;
    // PromiseComponent handles submitting the form.
    const formData = getFormValues(Form.formName)(store.getState());
    if (_.isEqual(formData, _.get(obj, path))) {
      cancel();
      return;
    }

    const newLimits = _.set({}, path, formData);
    const newConfig = _.defaultsDeep(newLimits, this.props.config);

    const promise = k8sPatch(k8sKinds.ConfigMap, obj, [{
      op: 'replace',
      path: '/data/config.yaml',
      value: safeDump(newConfig),
    }]);

    this.handlePromise(promise).then(cancel);
  }

  render () {
    const { title, description } = this.props;

    return <form onSubmit={e => this._submit(e)}>
      <ModalTitle>{title}</ModalTitle>
      <ModalBody>
        <div className="row co-m-form-row">
          <div className="col-sm-12">{description}</div>
        </div>
        <div className="row co-m-form-row">
          <this.props.Form handleSubmit={this._submit} />
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Save Changes" cancel={e => this.props.cancel(e)} />
    </form>;
  }
}

const labelStyle = { fontWeight: 300 };
const MemCPUModalLink = ({section, type, config, obj}) => {
  const path = [section, 'resources', type];
  const {cpu=null, memory=null} = _.get(config, path, {});

  const onClick = () => {
    const modal = createModalLauncher(props => <PromSettingsModal {...props} />);
    const initialValues = { cpu, memory };
    const description = `Define the ${type === 'limits' ? 'resource' : 'request'} limits for the cluster ${section === 'prometheusK8s' ? 'Prometheus instance' : 'Alertmanager'}.`;
    const title = `Cluster Monitoring  ${type === 'limits' ? 'Resource' : 'Request'} Limits`;
    const CPUForm = () => <div>
      <div className="col-xs-5">
        <label style={labelStyle} className="text-muted text-uppercase" htmlFor="cpu">CPU cores</label>
        <Field name="cpu" component="input" type="text" className="form-control" style={{width: 150}} autoFocus placeholder="500m" />
      </div>
      <div className="col-xs-5">
        <label style={labelStyle} className="text-muted text-uppercase" htmlFor="memory">Memory</label>
        <Field name="memory" component="input" type="text" className="form-control" style={{width: 150}} placeholder="50Mi" />
      </div>
    </div>;
    const Form = reduxForm({form: 'MemoryAndCPU', initialValues})(CPUForm);
    Form.formName = 'MemoryAndCPU';

    return modal({title, description, config, obj, Form, path});
  };

  return <a className="co-m-modal-link" onClick={onClick}>
    {`CPU: ${cpu || empty}, Memory: ${memory || empty}`}
  </a>;
};

const RetentionModalLink = ({config, obj}) => {
  const path = ['prometheusK8s'];
  const { retention=null } = _.get(config, path, {});

  const onClick = () => {
    const modal = createModalLauncher(props => <PromSettingsModal {...props} />);
    const initialValues = { retention };
    const description = 'Specify the retention time of cluster monitoring samples.';
    const title = 'Cluster Monitoring Sample Retention';
    const RetentionForm = () => <div>
      <div className="col-xs-5">
        <label style={labelStyle} className="text-muted text-uppercase" htmlFor="retention">sample retention</label>
        <Field name="retention" component="input" type="text" className="form-control" style={{width: 150}} autoFocus placeholder="24h" />
      </div>
    </div>;

    const Form = reduxForm({form: 'RetentionForm', initialValues})(RetentionForm);
    Form.formName = 'RetentionForm';

    return modal({title, description, config, obj, Form, path});
  };

  return <a className="co-m-modal-link" onClick={onClick}>
    {retention || empty}
  </a>;
};

class Expander extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = {expanded: !!props.expanded};
    this.expand = () => this.setState({expanded: !this.state.expanded});
  }

  render () {
    return <div className="co-cluster-updates__component">
      <div className="co-cluster-updates__heading">
        <div className="co-cluster-updates__heading--name-wrapper">
          <span className="co-cluster-updates__heading--name">{this.props.title}</span>
        </div>
        <a className="co-cluster-updates__toggle" onClick={this.expand}>
          {
            this.state.expanded
              ? 'Collapse'
              : 'Expand'
          }
        </a>
      </div>
      { this.state.expanded && this.props.children }
    </div>;
  }
}

class ClusterMonitoring_ extends React.PureComponent {
  render () {
    const { obj } = this.props;
    const config = safeLoad(_.get(obj, ['data', 'config.yaml']));

    return <div>
      <Expander title="Cluster Monitoring" expanded={true}>
        <div className="row">
          <div className="col-md-6">
            <dl>
              <dt>Resource Limits</dt>
              <dd>
                <MemCPUModalLink section="prometheusK8s" type="limits" config={config} obj={obj} />
              </dd>
              <dt>Request Limits</dt>
              <dd>
                <MemCPUModalLink section="prometheusK8s" type="requests" config={config} obj={obj} />
              </dd>
            </dl>
          </div>
          <div className="col-md-6">
            <dl>
              <dt>Retention</dt>
              <dd>
                <RetentionModalLink config={config} obj={obj} />
              </dd>
            </dl>
          </div>
        </div>
      </Expander>
      <Expander title="Cluster Alerting" expanded={true}>
        <div className="row">
          <div className="col-md-6">
            <dl>
              <dt>Resource Limits</dt>
              <dd>
                <MemCPUModalLink section="alertmanagerMain" type="limits" config={config} obj={obj} />
              </dd>
              <dt>Request Limits</dt>
              <dd>
                <MemCPUModalLink section="alertmanagerMain" type="requests" config={config} obj={obj} />
              </dd>
            </dl>
          </div>
          <div className="col-md-6">
            <dl>
              <dt>Storage</dt>
              <dd>
                {_.get(config, 'alertmanagerMain.volumeClaimTemplate') || empty}
              </dd>
              <dt>Alert manager</dt>
              <dd><AlertManagersListContainer /></dd>
            </dl>
          </div>
        </div>
      </Expander>
    </div>;
  }
}

const SettingsWrapper = props => <div className="co-cluster-updates">
  <StatusBox {...props.obj} label="Tectonic Monitoring Configuration">
    <ClusterMonitoring_ obj={props.obj.data} />
  </StatusBox>
</div>;

const resources = [{
  kind: 'ConfigMap',
  namespace: 'tectonic-system',
  isList: false,
  name: 'tectonic-monitoring',
  prop: 'obj',
}];

export const ClusterMonitoring = () => <Firehose resources={resources}><SettingsWrapper /></Firehose>;
