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

const MemoryAndCPUFormName = 'MemoryAndCPUForm';
const MemoryAndCPUForm = initialValues => reduxForm({form: MemoryAndCPUFormName, initialValues})(() => <div>
  <div className="col-xs-5">
    <label style={{fontWeight: 300}} className="text-muted" htmlFor="cpu">CPU cores</label>
    <Field name="cpu" component="input" type="text" className="form-control" style={{width: 150}} autoFocus placeholder="500m" />
  </div>
  <div className="col-xs-5">
    <label style={{fontWeight: 300}} className="text-muted" htmlFor="memory">Memory</label>
    <Field name="memory" component="input" type="text" className="form-control" style={{width: 150}} placeholder="50Mi" />
  </div>
</div>);


class PromSettingsModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this.Form = MemoryAndCPUForm(this.props.initialValues);
  }

  _submit (e) {
    e.preventDefault();

    // PromiseComponent handles submitting the form.
    const formData = getFormValues(MemoryAndCPUFormName)(store.getState());
    if (_.isEqual(formData, this.props.initialValues)) {
      this.props.cancel();
      return;
    }

    const { section, type, config } = this.props;

    const newLimits = {[section]: {resources: {[type]: formData}}};
    const newConfig = _.defaultsDeep(newLimits, config);

    const promise = k8sPatch(k8sKinds.ConfigMap, this.props.obj, [{
      op: 'replace',
      path: '/data/config.yaml',
      value: safeDump(newConfig),
    }]);

    this.handlePromise(promise).then(this.props.cancel);
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
          <this.Form handleSubmit={this._submit} />
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Save Changes" cancel={e => this.props.cancel(e)} />
    </form>;
  }
}

const cpuMemModal = createModalLauncher(props => <PromSettingsModal {...props} />);

const MemCPUModalLink = ({section, type, config, obj}) => {
  const {cpu=null, memory=null} = _.get(config, [section, 'resources', type], {});
  const initialValues = { cpu, memory };

  const description = `Define the ${type === 'limits' ? 'resource' : 'request'} limits for the cluster ${section === 'prometheusK8s' ? 'Prometheus instance' : 'Alertmanager'}.`;
  const title = `Cluster Monitoring  ${type === 'limits' ? 'Resource' : 'Request'} Limits`;

  return <a className="co-m-modal-link" onClick={() => cpuMemModal({title, description, initialValues, type, config, section, obj})}>
    {`CPU: ${cpu || empty}, Memory: ${memory || empty}`}
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
                {_.get(config, 'prometheusK8s.retention') || empty}
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
