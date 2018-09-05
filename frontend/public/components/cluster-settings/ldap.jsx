import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { saveAs } from 'file-saver';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { safeLoad, safeDump } from 'js-yaml';
import { Field, reduxForm, formValueSelector, getFormValues } from 'redux-form';

import store from '../../redux';
import { k8sGet } from '../../module/k8s';
import { ConfigMapModel } from '../../models';
import { SafetyFirst } from '../safety-first';
import { coFetchJSON } from '../../co-fetch';
import { LoadingInline, LoadError, NavTitle } from '../utils';
import { SettingsRow, SettingsLabel, SettingsContent } from './cluster-settings';

export const LDAPSetting = () => <SettingsRow>
  <SettingsLabel>LDAP</SettingsLabel>
  <SettingsContent>
    <Link className="co-m-modal-link" to="/settings/ldap">LDAP</Link>
  </SettingsContent>
</SettingsRow>;

const INSTRUCTIONS_APPLY = 'kubectl apply -f ~/Downloads/new-tectonic-config.yaml';

const INSTRUCTIONS_PATCH = `kubectl patch deployment tectonic-identity \\
    --patch "{\\"spec\\":{\\"template\\":{\\"metadata\\":{\\"annotations\\":{\\"date\\":\\"\`date +'%s'\`\\"}}}}}" \\
    --namespace tectonic-system`;

// silence react warnings :(:(:(
Field.defaultProps = {name: ''};

const LDAPFormName = 'LDAPFormName';

const Host = 'config.host';
const ServiceAccountDN = 'config.bindDN';
const ServiceAccountPassword = 'config.bindPW';
const UserBaseDN = 'config.userSearch.baseDN';
const UserFilter = 'config.userSearch.filter';
const UserUsername = 'config.userSearch.username';
const UserUserId = 'config.userSearch.idAttr';
const UserEmailAttr = 'config.userSearch.emailAttr';
const UserNameAttribute = 'config.userSearch.nameAttr';
const GroupBaseDN = 'config.groupSearch.baseDN';
const GroupFilter = 'config.groupSearch.filter';
const GroupUserAttribute = 'config.groupSearch.userAttr';
const GroupMemberAttribute = 'config.groupSearch.groupAttr';
const GroupNameAttribute = 'config.groupSearch.nameAttr';

const Username = 'username';
const Password = 'password';
const RootCA = 'Root CA';
const SSLType = 'sslType';
const Skip = 'skip';
const NoSSL = 'NoSSL';

const Fields = {
  Globals: [
    {
      name: Host,
      label: 'Host',
      help: 'Host and optional port of the LDAP server in the form "host:port".',
      placeholder: 'ldap.example.com:636',
      autoFocus: true,
    },
  ],
  TestData: [
    {
      name: Username,
      label: 'Username',
    },
    {
      name: Password,
      label: 'Password',
      type: 'password'
    },
  ],
  ServiceAccount: [
    {
      name: ServiceAccountDN,
      label: 'Username',
      placeholder: 'uid=seviceaccount,cn=users,dc=example,dc=com',
    },
    {
      name: ServiceAccountPassword,
      label: 'Password',
      type: 'password',
      placeholder: 'password',
    },
  ],
  Users: [
    {
      name: UserBaseDN,
      label: 'Base DN',
      help: 'BaseDN to start the user search from. It will translate to the query: "(&(objectClass=person)(uid=<username>))".',
      placeholder: 'cn=users,dc=example,dc=com',
    },
    {
      name: UserFilter,
      label: 'Filter',
      help: 'Optional filter to apply when searching the directory.',
      placeholder: '(objectClass=person)',
    },
    {
      name: UserUsername,
      label: 'Username Attribute',
      help: 'Username attribute used for comparing user entries. This will be translated and combined with the other filter as "(<attr>=<username>)". For the end user, this is the field they\'ll use as their username.',
      default: 'mail',
    },
    {
      name: UserUserId,
      label: 'User Id Attribute',
      help: 'String representation of the user\'s unique identifier.',
      default: 'uid',
    },
    {
      name: UserEmailAttr,
      label: 'Email Attribute',
      help: 'Required. Attribute to map to Email.',
      default: 'mail',
    },
    {
      name: UserNameAttribute,
      label: 'Name Attribute',
      help: 'Maps to display name of users. No default value.',
      default: 'name',
    },
  ],
  Groups: [
    {
      name: GroupBaseDN,
      label: 'Base DN',
      help: 'BaseDN to start the group search from. It will translate to the query: (&(objectClass=group)(member=<user uid>)).',
      placeholder: 'cn=groups,dc=freeipa,dc=example,dc=com',
    },
    {
      name: GroupFilter,
      label: 'Filter',
      help: 'Optional filter to apply when searching the directory.',
      placeholder: '(objectClass=group)',
    },
    {
      name: GroupUserAttribute,
      label: 'User Attribute',
      help: 'Matches the user attribute against a group.',
      default: 'uid',
    },
    {
      name: GroupMemberAttribute,
      label: 'Member Attribute',
      help: 'Matches a user to a group.',
      default: 'member',
    },
    {
      name: GroupNameAttribute,
      label: 'Name Attribute',
      help: 'The name of a group.',
      default: 'name',
    },
  ],
};

const Steps = [
  {
    fields: 'Globals',
    next: 'LDAP Service Account',
  },
  {
    fields: 'ServiceAccount',
    name: 'LDAP Service Account',
    description: 'If your LDAP server allows anonymous authorization, you must provide additional credentials to search for users and groups.',
    next: 'LDAP User Info',
  },
  {
    fields: 'Users',
    name: 'Users',
    next: 'LDAP Group Info',
  },
  {
    fields: 'Groups',
    name: 'Groups',
    next: 'Test LDAP config',
  },
  {
    fields: 'TestData',
    name: 'Test Configuration',
    description: 'Supply your credentials to test the current configuration. The LDAP server must be reachable from the Tectonic Console for testing to work.',
  },
];

const Help = ({children}) => <div><small className="text-muted">{children}</small></div>;

const Row = ({children, name, label}) =>
  <div className="form-group co-m-form-row">
    {label
      ? <label className="col-sm-2 control-label" htmlFor={name}>{label}</label>
      : <div className="col-sm-2 control-label"></div>
    }
    <div className="co-m-form-col col-sm-10">
      {children}
    </div>
  </div>;

const FieldRow = field => {
  const component = field.component || 'input';
  const type = field.type || 'text';
  const className = field.className || 'form-control';

  return <Row name={field.name} label={field.label || field.name} key={field.name}>
    <div>
      <Field component={component} type={type} placeholder={field.placeholder || field.default}
        className={className} autoFocus={field.autoFocus} name={field.name}
        autoCorrect="off" autoCapitalize="off" autoComplete="off" spellCheck="false"
      />
      <Help>{field.help}</Help>
    </div>
  </Row>;
};

const initialValues = {};
_.each(Fields, fields => {
  _.each(fields, field => {
    _.set(initialValues, field.name, field.default || '');
  });
});

// simple helper function to marshal internal representation to external
const reduxToConnector = data => {
  const connector = _.cloneDeep(data);
  const {config} = connector;

  // the data from the wire may be inconsistent since a radio box is split over 3 keys :-/
  delete config.insecureSkipVerify;
  delete config.insecureNoSSL;

  switch (connector[SSLType]) {
    case RootCA:
      config.rootCAData = btoa((connector[RootCA] || '').trim());
      break;
    case Skip:
      // delete config[RootCA];
      config.insecureSkipVerify = true;
      break;
    case NoSSL:
      // delete config[RootCA];
      config.insecureNoSSL = true;
      break;
    default:
      break;
  }

  delete connector[SSLType];
  delete connector[RootCA];

  return connector;
};

const connectorToRedux = connector => {
  connector = _.cloneDeep(connector) || {};
  const config = connector && connector.config || {};
  if (config.rootCAData) {
    connector[RootCA] = atob(config.rootCAData);
    connector[SSLType] = RootCA;
  }

  if (config.insecureSkipVerify) {
    connector[SSLType] = Skip;
  }

  if (config.insecureNoSSL) {
    connector[SSLType] = NoSSL;
  }

  return connector;
};


const selector = formValueSelector(LDAPFormName);

const Security = connect(state => ({sslValue: selector(state, SSLType)})
)(({sslValue}) => <div>
  <Row name={SSLType}>
    <label><Field name={SSLType} component="input" type="radio" value={NoSSL} /> No SSL</label>
    <Help>Required if LDAP host does not use SSL.</Help>
  </Row>
  <Row name={SSLType}>
    <label><Field name={SSLType} component="input" type="radio" value={Skip} /> Skip Verification</label>
    <Help>Don&rsquo;t verify the CA.</Help>
  </Row>
  <Row name={SSLType}>
    <label><Field name={SSLType} component="input" type="radio" value={RootCA} /> Root CA</label>
    <Help>PEM data containing the root CAs.</Help>
    { sslValue === RootCA &&
      <div>
        <br />
        <Field name={RootCA} component="textarea" className="form-control col-lg-4 col-sm-9" autoCorrect="off" autoCapitalize="off" autoComplete="off" spellCheck="false" />
      </div>
    }
  </Row>
</div>);

const STATES = {'untested': 1, 'invalid': 2, 'valid': 3, 'updating': 4};

const LDAPs = reduxForm({
  initialValues,
  // reduxForm API contract...
  onSubmit: ()=>{},
  form: LDAPFormName,
  validate: (values, props) => {
    // Declare a general field error using a nonce *any time any field changes*
    const errs = {_error: props.error ? props.error + 1 : 1};
    _.each(Fields, fields => _.each(fields, field => {
      const v = _.get(values, field.name);
      if (!v || v.trim() === v) {
        return;
      }
      // TODO: (ggreer) add a renderField param to Field in FieldRow that renders this error
      _.set(errs, field.name, 'No leading or trailing spaces allowed.');
      errs._error++;
    }));
    return errs;
  },
})(
  class LDAPs extends SafetyFirst {
    constructor(props) {
      super(props);
      this.state = {
        stateMachine: STATES.untested,
        configDotYaml: null,
        validationData: null,
        validationError: null,
        loadError: null,
        tectonicIdentityConfig: null,
        populated: {},
      };
    }

    componentWillReceiveProps({error}) {
      const { validatedVersion } = this.state;
      if (validatedVersion && validatedVersion !== error) {
        this.setState({stateMachine: STATES.untested, validationData: null, validationError: null});
      }
    }

    componentDidMount() {
      super.componentDidMount();
      k8sGet(ConfigMapModel, 'tectonic-identity', 'tectonic-system')
        .then(d => {
          const configDotYaml = safeLoad(d.data['config.yaml']) || {};
          const connectorIndex = _.findIndex(configDotYaml.connectors, connector => connector.type === 'ldap' && connector.id === 'tectonic-ldap');
          this.setState({configDotYaml, connectorIndex, loadError: null, tectonicIdentityConfig: d});
          if (connectorIndex === -1) {
            return;
          }
          const formData = connectorToRedux(configDotYaml.connectors[connectorIndex]);
          if (_.isEmpty(formData)) {
            return;
          }
          this.props.initialize(formData);
        })
        .catch(loadError => this.setState({loadError}));
    }
    downloadBackup (e) {
      e.preventDefault();
      const blob = new Blob([safeDump(this.state.tectonicIdentityConfig)], { type: 'text/yaml;charset=utf-8' });
      saveAs(blob, 'tectonic-identity.yaml');
    }

    downloadNewConfig (e) {
      e.preventDefault();

      const formData = getFormValues(LDAPFormName)(store.getState());

      // only used for LDAP Testing
      delete formData[Username];
      delete formData[Password];

      const { configDotYaml, connectorIndex } = this.state;
      const newYaml = _.cloneDeep(configDotYaml);

      let connector;
      if (connectorIndex >= 0) {
        connector = newYaml.connectors[connectorIndex];
      } else {
        newYaml.connectors = newYaml.connectors || [];
        connector = {name: 'ldap', id: 'tectonic-ldap', type: 'ldap'};
        newYaml.connectors.push(connector);
      }

      if (connector.config) {
      // a merge won't stomp on these keys :-/
        delete connector.config.insecureSkipVerify;
        delete connector.config.insecureNoSSL;
      }

      _.merge(connector, reduxToConnector(formData));

      const yaml = safeDump(newYaml, null, 4);
      const configMap = _.cloneDeep(this.state.tectonicIdentityConfig);
      configMap.data['config.yaml'] = yaml;
      delete configMap.metadata.selfLink;
      delete configMap.metadata.uid;
      delete configMap.metadata.resourceVersion;
      delete configMap.metadata.creationTimestamp;

      const dump = safeDump(configMap, null, 4);
      const blob = new Blob([dump], { type: 'text/yaml;charset=utf-8' });
      saveAs(blob, 'new-tectonic-config.yaml');
    }

    test (e) {
      e.preventDefault();
      this.setState({validationData: null, validationError: null, stateMachine: STATES.untested}, () => {
        const version = this.props.error;
        const connector = getFormValues(LDAPFormName)(store.getState());
        const json = reduxToConnector(connector);
        coFetchJSON.post('api/tectonic/ldap/validate', json)
          .then(data => {
            const state = {};
            if (data.error) {
              state.stateMachine = STATES.invalid;
              state.validationError = data.error;
              state.validationData = data.reason;
            } else {
              state.stateMachine = STATES.valid;
              state.validationData = data;
              state.validatedVersion = version;
              state.validationError = null;
            }
            this.setState(state, () => {
              window.scrollTo(0, document.documentElement.offsetHeight);
            });
          })
          .catch(error => {
            this.setState({validationError: 'Error', validationData: error.message || error.toString(), stateMachine: STATES.invalid});
          });
      });
    }

    continue (e) {
      e.preventDefault();
      this.setState({stateMachine: STATES.updating});
    }

    populate (stepName) {
      const populated = this.state.populated;
      populated[stepName] = true;
      this.setState({populated});
    }

    render () {
      if (this.state.loadError) {
        return <LoadError label="Tectonic Identity Configuration" loadError={this.state.loadError} />;
      }

      if (!this.state.tectonicIdentityConfig) {
        return <div>Loading Configuration <LoadingInline /></div>;
      }

      // General field errors are under the props.error - see validation above
      const disabled = !this.state.validatedVersion || this.state.validatedVersion !== this.props.error;

      const { stateMachine, validationData, validationError } = this.state;

      const steps = [];

      _.each(Steps, (s, i) => {
        const stepName = s.fields;
        const fields = Fields[stepName];
        const populated = !!this.state.populated[stepName];
        const lastStep = i === Steps.length - 1;
        const step = <div key={`step-${stepName}`}>
          { s.name && <h2 className="co-section-heading ldap-group">{s.name}</h2> }
          { s.description && <p className="co-m-form-row">{s.description}</p> }
          { _.map(fields, FieldRow) }
          { stepName === 'Globals' && <Security /> }
          <hr />
          { s.next && !populated && <div><p className="text-muted">Next: {s.next}</p><hr /></div> }
          { !lastStep && !populated && <a onClick={() => this.populate(stepName)}><button className="btn btn-primary">Continue</button></a> }
        </div>;

        steps.push(step);
        return populated;
      });

      let test = false;
      if (steps.length === Steps.length) {
        test = (<div>
          { (stateMachine === STATES.valid || stateMachine === STATES.invalid) &&
          <Row label="Test Results">
            { validationError
              ? <p className="alert alert-danger"><span className="pficon pficon-error-circle-o"></span>Error - {validationError}:
                <br />
                <span>{validationData}</span>
              </p>
              : <div>
                <dl>
                  <dt>username</dt>
                  <dd>{validationData.username}</dd>
                  <dt>email</dt>
                  <dd>{validationData.email}</dd>
                  <dt>groups</dt>
                  <dd>{_.map(validationData.groups, g => <div key={g}>{g}</div>)}</dd>
                </dl>
              </div>
            }
          </Row>
          }

          {stateMachine !== STATES.updating && <div>
            <p className="text-muted">Next: Update Tectonic Identity</p>
            <hr />
          </div>}

          {(stateMachine === STATES.untested || stateMachine === STATES.invalid) &&
          <button className="btn btn-primary" onClick={(e) => this.test(e)}>Test Configuration</button>
          }
          {stateMachine === STATES.valid &&
          <button className="btn btn-primary" onClick={e => this.continue(e)} disabled={disabled}>Continue</button>
          }
          {stateMachine === STATES.updating && <div>
            <h2 className="co-section-heading ldap-group">Update Tectonic Identity</h2>
            <p>
            The last step is to apply the updated configuration to the cluster.
            This is done via <code>kubectl</code> to avoid locking yourself out if something goes wrong.
              <br /><br />
            During installation, an assets bundle was generated which included a kubeconfig (users name <code>kubelet</code>) that bypasses Tectonic Identity in the case that the older configuration needs to be re-applied.
              <br /><br />
              <b>It is highly recommended you use the root kubeconfig and that you download a backup of the current configuration before proceeding.</b>
            </p>

            <pre>
              <code>{INSTRUCTIONS_APPLY}</code>
            </pre>

            <p>
            Next, trigger a rolling-update of the <Link target="_blank" to="/k8s/ns/tectonic-system/deployments/tectonic-identity/pods">Identity pods</Link>, which will read the new configuration.
            </p>

            <pre style={{marginBottom: 30}}>
              <code>{INSTRUCTIONS_PATCH}</code>
            </pre>

            <p className="row col-sm-12">
              <button className="btn btn-primary" onClick={e => this.downloadNewConfig(e)}>Download New Config</button>
              <button className="btn btn-default" onClick={e => this.downloadBackup(e)}>Download Existing Config</button>
            </p>
          </div>}
        </div>);
      }

      return <form className="form-horizontal" style={{maxWidth: 900}}>
        { steps }
        { test }
      </form>;
    }
  });

export const LDAPPage = () => <div>
  <Helmet>
    <title>LDAP</title>
  </Helmet>
  <NavTitle title="LDAP" />
  <div className="co-m-pane__body">
    <LDAPs />
  </div>
</div>;
