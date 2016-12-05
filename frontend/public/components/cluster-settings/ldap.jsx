import React from 'react';
import { Provider, connect } from 'react-redux';
import { safeLoad, safeDump } from 'js-yaml';
import { Field, reduxForm, formValueSelector, getFormValues } from 'redux-form';

import { makeList } from '../factory';
import { SafetyFirst } from '../safety-first';
import { coFetchPostJSON } from '../../co-fetch';
import { angulars, register } from '../react-wrapper';
import { createModalLauncher, ModalTitle, ModalBody, ModalFooter } from '../factory/modal';
import { podPhase, ResourceIcon, Timestamp, LoadingInline, LoadError, NavTitle, resourcePath} from '../utils';


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


const IdentityRows = ({obj: pod}) => {
  const phase = podPhase(pod);
  let status = phase;

  if (status !== 'Running') {
    status = <span className="co-error" >
      <i className="fa fa-times-circle co-icon-space-r" />{phase}
    </span>;
  }

  const {name, namespace, uid, creationTimestamp} = pod.metadata;

  return <div className="row co-resource-list__item">
    <div className="col-xs-5">
      <ResourceIcon kind="pod" />
      <a target="_blank" href={`${resourcePath('pod', namespace, name)}/details`} title={uid}>{name}</a>
    </div>
    <div className="col-xs-3">{status}</div>
    <div className="col-xs-4">{<Timestamp timestamp={creationTimestamp} />}</div>
  </div>;
};

const IdentityHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-5">Pod</div>
  <div className="col-xs-3">Status</div>
  <div className="col-xs-4">Created</div>
</div>;

const JobsList = makeList('TectonicIdentity', 'POD', IdentityHeader, IdentityRows);

class UpdateDex extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = { err: false };
  }

  componentDidMount() {
    super.componentDidMount();

    const {patch} = this.props;
    const {configmaps, pods} = angulars.k8s;

    configmaps.patch({metadata: {name: 'tectonic-identity', namespace: 'tectonic-system'}}, patch)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('Deleting Tectonic Identity pod');

      const query = {queryParams: {labelSelector: encodeURIComponent('component=identity')}};
      const pod = {metadata: {namespace: 'tectonic-system'}};
      return pods.delete(pod, query);
    })
    // eslint-disable-next-line no-console
    .then(() => console.log('Tectonic Identity is Restarting'))
    .catch(err => {
      // eslint-disable-next-line no-console
      console.error(err);
      this.setState({err});
    });
  }
  render () {
    return <div>
      <ModalTitle>Updating Tectonic Identity</ModalTitle>
      <ModalBody>
        <br/>
        <p>
          The existing Tectonic Identity pod will terminate and another will be created while the service is updating.
          <br/>
          This should take about 30 seconds.
        </p>
        <p className="co-error">
          {this.state.err}
        </p>
        <br/>
        <JobsList key="const" namespace="tectonic-system" selector={{matchLabels: {component: 'identity'}}} />
        <br/>
      </ModalBody>
      <ModalFooter>
        <button onClick={this.props.close} className="btn btn-primary">Close</button>
      </ModalFooter>
    </div>;
  }
}

export const statusModal = createModalLauncher(UpdateDex);


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
      help: 'BaseDN to start the search from. It will translate to the query: "(&(objectClass=person)(uid=<username>))".',
      placeholder: 'baseDN: cn=users,dc=example,dc=com',
    },
    {
      name: UserFilter,
      label: 'Filter',
      help: 'Optional filter to apply when searching the directory.',
      placeholder: '(objectClass=person)',
    },
    {
      name: UserUsername,
      label: 'Username',
      help: 'Username attribute used for comparing user entries. This will be translated and combined with the other filter as "(<attr>=<username>)".',
      default: 'uid',
    },
    {
      name: UserUserId,
      label: 'Attribute',
      help: 'String representation of the user.',
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
      help: 'BaseDN to start the search from. It will translate to the query: (&(objectClass=group)(member=<user uid>)).',
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

const Help = ({children}) => <div><small className="text-muted">{children}</small></div>;

const Row = ({children, name, label}) =>
<div className="row co-m-form-row">
  <div className="col-sm-2">
    {label
      ? <label className="control-label" htmlFor={name}>{label}:</label>
      : <div className="col-sm-3 control-label"></div>
    }
  </div>
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
    <label><Field name={SSLType} component="input" type="radio" value={NoSSL}/> No SSL</label>
    <Help>Required if LDAP host does not use TLS.</Help>
  </Row>
  <Row name={SSLType}>
    <label><Field name={SSLType} component="input" type="radio" value={Skip} /> Skip Verification</label>
    <Help>Don't verify the CA.</Help>
  </Row>
  <Row name={SSLType}>
    <label><Field name={SSLType} component="input" type="radio" value={RootCA} /> Root CA</label>
    <Help>PEM data containing the root CAs.</Help>
    { sslValue === RootCA &&
      <div>
        <br/>
        <Field name={RootCA} component="textarea" className="form-control col-lg-4 col-sm-9" autoCorrect="off" autoCapitalize="off" autoComplete="off" spellCheck="false"/>
      </div>
    }
  </Row>
</div>);


const LDAPs = reduxForm({
  initialValues, onSubmit: ()=>{},
  form: LDAPFormName,
})(
class LDAPs extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      configDotYaml: null,
      validationData: null,
      validationError: null,
      loadError: null,
    };
  }


  componentDidMount() {
    super.componentDidMount();
    angulars.k8s.configmaps.get('tectonic-identity', 'tectonic-system')
    .then(d => {
      const configDotYaml = safeLoad(d.data['config.yaml']) || {};
      const connectorIndex = _.findIndex(configDotYaml.connectors, connector => connector.type === 'ldap' && connector.id === 'tectonic-ldap');
      this.setState({configDotYaml, connectorIndex, loadError: null});
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

  submit (e) {
    e.preventDefault();
    const formData = getFormValues(LDAPFormName)(angulars.store.getState());

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

    _.merge(connector, reduxToConnector(formData));

    // a merge won't stomp on these keys :-/
    delete connector.config.insecureSkipVerify;
    delete connector.config.insecureNoSSL;

    const yaml = safeDump(newYaml, null, 4);
    const patch = [{ op: 'replace', path: '/data/config.yaml', value: yaml }];

    statusModal({patch});
  }

  test (e) {
    e.preventDefault();
    const connector = getFormValues(LDAPFormName)(angulars.store.getState());
    const json = reduxToConnector(connector);
    coFetchPostJSON('tectonic/ldap/validate', json)
    .then(data => {
      const state = {};
      if (data.error) {
        state.validationError = data.error;
        state.validationData = data.reason;
      } else {
        try {
          state.validationData = JSON.stringify(data, null, 4);
        } catch (ignored) {
          state.validationData = data;
        }
        state.validationError = null;
      }
      this.setState(state);
    })
    .catch(error => this.setState({validationError: error, validationData: ''}));
  }

  render () {
    const { pristine, submitting } = this.props;
    if (this.state.loadError) {
      return <LoadError label="Tectonic Identity Configuration" loadError={this.state.loadError}/>;
    }

    if (!this.state.configDotYaml) {
      return <div>Loading Configuration <LoadingInline /></div>;
    }

    return <form className="form-horizontal">
      { _.map(Fields.Globals, FieldRow) }

      <Security/>

      <hr/>
      <h1 className="co-section-title ldap-group">LDAP Service Account</h1>

      <p className="co-m-form-row">
        If your LDAP server does allow anonymous authorization, you
        must provide additional credentials to search for users and groups.
      </p>

      { _.map(Fields.ServiceAccount, FieldRow) }

      <hr/>

      <h1 className="co-section-title ldap-group">Users</h1>

      { _.map(Fields.Users, FieldRow) }

      <hr/>

      <h1 className="co-section-title ldap-group">Groups</h1>

      { _.map(Fields.Groups, FieldRow) }

      <hr/>
      <h1 className="co-section-title ldap-group">Test Configuration</h1>

      <p className="co-m-form-row">
        Supply your credentials to test the current configuration.
        The LDAP server must be reachable from the Tectonic Console for testing to work.
      </p>

      { _.map(Fields.TestData, FieldRow) }

      { this.state.validationData &&
        <Row>
          {this.state.validationError
            ? <p className="co-error">Error - {this.state.validationError}:</p>
            : <p className="co-success">Success!</p>
          }
          <pre><code>{this.state.validationData}</code></pre>
        </Row>
      }

      <Row>
        <button className="btn btn-primary" onClick={(e) => this.test(e)}>Test Configuration</button>
      </Row>

      <hr/>

      <div>
        <button className="btn btn-primary" onClick={(e) => this.submit(e)} disabled={pristine || submitting}>Update Tectonic Identity</button>
      </div>
    </form>;
  }
});

const LDAPPage = () => <div>
  <NavTitle title="LDAP" />
  <div className="co-m-pane">
    <div className="co-m-pane__body">
      <Provider store={angulars.store} ><LDAPs /></Provider>
    </div>
  </div>
</div>;

register('LDAPPage', LDAPPage);
