import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import * as classNames from 'classnames';
import { safeLoad, safeDump } from 'js-yaml';
import { Field, reduxForm } from 'redux-form';

import { k8sPatch } from '../../module/k8s';
import { ConfigMapModel } from '../../models';
import { Firehose, StatusBox, PromiseComponent, ResourceLink, validate, units } from '../utils';
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
  constructor (props) {
    super(props);
    const { title, description, reduxFormWrapper, FormBody} = props;
    // NOTE: redux forms assumes it owns the entire form ...
    // including the submit button (ModalSubmitFooter)...
    this.Form = reduxFormWrapper(({handleSubmit, invalid, errorMessage, inProgress}) =>
      <form onSubmit={handleSubmit(e => this._submit(e))}>
        <ModalTitle>{title}</ModalTitle>
        <ModalBody>
          <div className="row co-m-form-row">
            <div className="col-sm-12">{description}</div>
          </div>
          <div className="row co-m-form-row">
            <FormBody />
          </div>
        </ModalBody>
        <ModalSubmitFooter
          submitDisabled={invalid}
          errorMessage={errorMessage}
          inProgress={inProgress}
          submitText="Save Changes"
          cancel={e => this.props.cancel(e)} />
      </form>
    );
  }
  _submit (formData) {
    const { obj, cancel, getNewConfig} = this.props;
    // PromiseComponent handles submitting the form.

    let newConfig;
    try {
      newConfig = _.defaultsDeep(getNewConfig(formData), this.props.config);
    } catch (err) {
      this.handlePromise(Promise.reject(err));
      return;
    }

    newConfig = sanitizeForProm_(newConfig);

    const promise = k8sPatch(ConfigMapModel, obj, [{
      op: 'replace',
      path: '/data/config.yaml',
      value: safeDump(newConfig),
    }]);

    this.handlePromise(promise).then(cancel, () => {});
  }

  render () {
    return <this.Form {...this.state} />;
  }
}

PromSettingsModal.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  reduxFormWrapper: PropTypes.func.isRequired,
  obj: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  getNewConfig: PropTypes.func.isRequired,
  FormBody: PropTypes.func.isRequired,
};

const labelStyle = { fontWeight: 300 };
const fieldStyle = { width: '100%' };

const renderField = ({
  input,
  type,
  autoFocus,
  placeholder,
  meta: {
    // touched,
    error,
    warning }
}) => <div>
  <input className={classNames('form-control', {'form-control--invalid': !!error})} style={fieldStyle} {...input} type={type} autoFocus={autoFocus} placeholder={placeholder} />
  {
    (error && <div className="error-message">{error}</div>) ||
      (warning && <span>{warning}</span>)
  }
</div>;

const convertToBaseUnit = (value, unit) => {
  if (!unit) {
    return value;
  }
  if (unit === 'm') {
    return value / 1000;
  }

  if (unit.endsWith('i')) {
    return units.dehumanize(`${value}${unit}`, 'binaryBytesWithoutB').value;
  }

  return units.dehumanize(`${value}${unit}`, 'SI').value;
};

const validateForm = validator => values => {
  const errors = {};

  _.each(values, (v, k) => {
    errors[k] = validator(v);
  });


  if (!values.request || !values.limit) {
    return errors;
  }

  let [requestFloat, requestUnit] = validate.split(values.request);
  let [limitFloat, limitUnit] = validate.split(values.limit);

  if (requestUnit !== limitUnit) {
    requestFloat = convertToBaseUnit(requestFloat, requestUnit);
    limitFloat = convertToBaseUnit(limitFloat, limitUnit);
  }

  if (requestFloat > limitFloat) {
    errors.limit = 'limit must exceed request';
  }

  return errors;
};

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

    const validator = type === 'cpu' ? validate.CPU : validate.memory;
    const helpText = type === 'cpu'
      ? <div className="col-xs-12 text-muted" style={{paddingTop: 15, paddingBottom: 10}}>
        Requests and limits for CPU resources are measured in &ldquo;cpu units&rdquo; in absolute quantities.
        The expression &ldquo;100m&rdquo; can be read as &ldquo;one hundred millicpus&rdquo; or &ldquo;one hundred millicores&rdquo;.
        See <a href="https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#meaning-of-cpu" target="_blank" className="co-external-link" rel="noopener noreferrer">Meaning of CPU</a> for details.
      </div>
      : <div className="col-xs-12 text-muted" style={{paddingTop: 15, paddingBottom: 10}}>
        Requests and limits for memory are measured in bytes.
        For example, the following are roughly equivalent: 128974848 ≈ 129M ≈ 123Mi.
        See <a href="https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#meaning-of-memory" target="_blank" className="co-external-link" rel="noopener  noreferrer">Meaning of memory</a> for more details.
      </div>;

    const FormBody = ({error}) => <div>
      <div className="col-xs-5">
        <label style={labelStyle} className="text-muted text-uppercase" htmlFor="request">Request</label>
        <Field name="request" type="text" placeholder={type === 'cpu' ? '500m' : '2Gi'} component={renderField} autoFocus />
      </div>
      <div className="col-xs-5">
        <label style={labelStyle} className="text-muted text-uppercase" htmlFor="limit">Limit</label>
        <Field name="limit" type="text" placeholder={type === 'cpu' ? '500m' : '2Gi'} component={renderField} />
      </div>
      {helpText}
      {error && <strong>{error}</strong>}
    </div>;

    const reduxFormWrapper = reduxForm({form: 'MemoryOrCPU', initialValues, validate: validateForm(validator)});

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

    return modal({title, description, config, obj, reduxFormWrapper, FormBody, getNewConfig});
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
    const FormBody = () => <div>
      <div className="col-xs-5">
        <label style={labelStyle} className="text-muted text-uppercase" htmlFor="retention">sample retention</label>
        <Field name="retention" type="text" component={renderField} autoFocus placeholder="24h" />
      </div>
    </div>;

    const reduxFormWrapper = reduxForm({form: 'RetentionForm', initialValues, validate: validateForm(validate.time)});

    const getNewConfig = formData => _.set({}, path, formData);

    return modal({title, description, obj, reduxFormWrapper, config, FormBody, getNewConfig});
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

    let vct = _.get(config, 'alertmanagerMain.volumeClaimTemplate', empty);
    if (_.isObject(vct)) {
      if (vct.metadata) {
        vct = <ResourceLink kind={vct.kind} name={vct.metadata.name} namespace={vct.metadata.namespace} />;
      } else {
        vct = <pre>{JSON.stringify(vct, null, 2)}</pre>;
      }
    }

    return <div>
      <Expander title="Cluster Monitoring">
        <div className="co-cluster-updates__details">
          <div className="co-cluster-updates__detail">
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
          <div className="co-cluster-updates__detail">
            <dl>
              <dt>Retention</dt>
              <dd>
                <RetentionModalLink config={config} obj={obj} />
              </dd>
            </dl>
          </div>
        </div>
      </Expander>
      <Expander title="Cluster Alerting">
        <div className="co-cluster-updates__details">
          <div className="co-cluster-updates__detail">
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
          <div className="co-cluster-updates__detail">
            <dl>
              <dt>Storage</dt>
              <dd>
                {vct}
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
