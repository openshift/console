import * as _ from 'lodash';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { safeLoad, safeDump } from 'js-yaml';
import { Field, reduxForm, getFormValues } from 'redux-form';

import store from '../../redux';
import { k8sPatch, k8sKinds } from '../../module/k8s';
import { Firehose, StatusBox, PromiseComponent } from '../utils';
import { AlertManagersListContainer } from '../alert-manager';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';


const empty = 'none';

// Remove all keys that map to non thruthy, non-top level values
export const sanitizeForProm_ = (obj, _depth=0) => _.transform(obj, (o, v, k) => {
  if (_.isObject(v)) {
    v = sanitizeForProm_(v, _depth+1);
  }

  // text inputs turn numbers into strings
  if (_.isString(v)) {
    const inted = parseFloat(k, 10);
    if (!_.isNaN(inted)) {
      v = inted;
    }
  }

  // drop non truthy non-zero values
  if (_.isEmpty(v) && v !== 0 ) {
    if (_depth > 0) {
      return;
    }
    // turn non-zero non-truthy values into null
    v = null;
  }
  o[k] = v;
});

class PromSettingsModal extends PromiseComponent {
  _submit (e) {
    e.preventDefault();

    const { Form, obj, cancel, getNewConfig} = this.props;
    // PromiseComponent handles submitting the form.
    const formData = getFormValues(Form.formName)(store.getState());
    let newConfig;
    try {
      newConfig = _.defaultsDeep(getNewConfig(formData), this.props.config);
    } catch (err) {
      this.handlePromise(Promise.reject(err));
      return;
    }

    newConfig = sanitizeForProm_(newConfig);

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

PromSettingsModal.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  Form: PropTypes.func.isRequired,
  obj: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  getNewConfig: PropTypes.func.isRequired,
};

const labelStyle = { fontWeight: 300 };
const fieldStyle = { width: 150 };

const MemCPUModalLink = ({section, type, config, obj}) => {
  const limit = _.get(config, [section, 'resources', 'limits', type], null);
  const request = _.get(config, [section, 'resources', 'requests', type], null);

  const onClick = () => {
    const modal = createModalLauncher(props => <PromSettingsModal {...props} />);
    const initialValues = { limit, request };
    const description = `Define the ${
      type === 'cpu' ? 'CPU' : 'memory'
    } request and limit for the tectonic ${
      section === 'prometheusK8s' ? 'Prometheus instance' : 'Alertmanager'
    }.  The request may not exceed the limit.`;
    const title = `Cluster Monitoring  ${type === 'cpu' ? 'CPU' : 'Memory'} Resource`;

    const CPUForm = () => <div>
      <div className="col-xs-5">
        <label style={labelStyle} className="text-muted text-uppercase" htmlFor="request">Request</label>
        <Field name="request" component="input" type="text" className="form-control" style={fieldStyle} placeholder={type === 'cpu' ? '500m' : '2Gi'} autoFocus />
      </div>
      <div className="col-xs-5">
        <label style={labelStyle} className="text-muted text-uppercase" htmlFor="limit">Limit</label>
        <Field name="limit" component="input" type="text" className="form-control" style={fieldStyle} placeholder={type === 'cpu' ? '500m' : '2Gi'} />
      </div>
    </div>;

    const Form = reduxForm({form: 'MemoryOrCPU', initialValues})(CPUForm);
    Form.formName = 'MemoryOrCPU';

    const getNewConfig = formData => ({
      [section]: {
        resources: {
          requests: {
            [type]: formData.request,
          },
          limits: {
            [type]: formData.limit,
          },
        }
      }
    });

    return modal({title, description, config, obj, Form, getNewConfig});
  };

  return <a className="co-m-modal-link" onClick={onClick}>
    {`Request: ${request || empty}, Limit: ${limit || empty}`}
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
        <Field name="retention" component="input" type="text" className="form-control" style={fieldStyle} autoFocus placeholder="24h" />
      </div>
    </div>;

    const Form = reduxForm({form: 'RetentionForm', initialValues})(RetentionForm);
    Form.formName = 'RetentionForm';

    const getNewConfig = formData => _.set({}, path, formData);

    return modal({title, description, obj, Form, config, getNewConfig});
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
              <dt>CPU Resources</dt>
              <dd>
                <MemCPUModalLink section="prometheusK8s" type="cpu" config={config} obj={obj} />
              </dd>
              <dt>Memory Resources</dt>
              <dd>
                <MemCPUModalLink section="prometheusK8s" type="memory" config={config} obj={obj} />
              </dd>
              <dt>Alert manager</dt>
              <dd><AlertManagersListContainer /></dd>
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
              <dt>CPU Resources</dt>
              <dd>
                <MemCPUModalLink section="alertmanagerMain" type="cpu" config={config} obj={obj} />
              </dd>
              <dt>Memory Resources</dt>
              <dd>
                <MemCPUModalLink section="alertmanagerMain" type="memory" config={config} obj={obj} />
              </dd>
            </dl>
          </div>
          <div className="col-md-6">
            <dl>
              <dt>Storage</dt>
              <dd>
                {_.get(config, 'alertmanagerMain.volumeClaimTemplate') || empty}
              </dd>
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
