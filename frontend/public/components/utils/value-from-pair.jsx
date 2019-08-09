import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';

import { Dropdown, ResourceName} from './';

// https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.10/#envvarsource-v1-core
//   valueFrom:
//     fieldRef:
//       fieldPath: spec.nodeName

//   valueFrom:
//     secretKeyRef:
//       name: mysecret
//       key: username

//   valueFrom:
//     configMapKeyRef:
//       name: tectonic-config
//       key: consoleBaseAddress

//   valueFrom:
//     resourceFieldRef:
//       containerName: test-container
//       resource: requests.cpu
//       divisor: 1 // 1 is default

const getSpacer = (configMap, secret) => {
  const spacerBefore = new Set();
  return _.isEmpty(configMap) || _.isEmpty(secret) ? spacerBefore : spacerBefore.add(secret);
};

const getHeaders = (configMap, secret) => {
  if (_.isEmpty(configMap) && _.isEmpty(secret)) {
    return {};
  } else if (_.isEmpty(configMap)) {
    return {[secret]: 'Secrets'};
  } else if (_.isEmpty(secret)) {
    return {[configMap]: 'Config Maps'};
  }
  return {
    [configMap]: 'Config Maps',
    [secret]: 'Secrets',
  };
};

const getKeys = (keyMap) => {
  const itemKeys = {};
  _.mapKeys(keyMap, (value, key) => itemKeys[key] = key);
  return itemKeys;
};

export const NameKeyDropdownPair = ({name, key, configMaps, secrets, onChange, kind, nameTitle, placeholderString, isKeyRef = true}) => {
  let itemKeys = {};
  let refProperty;
  const cmItems = {};
  const secretItems = {};
  const nameAutocompleteFilter = (text, item) => fuzzy(text, item.props.name);
  const keyAutocompleteFilter = (text, item) => fuzzy(text, item);
  const keyTitle = _.isEmpty(key) ? <span className="pf-c-dropdown__toggle-text--placeholder">Select a key</span> : <span>{key}</span>;
  const cmRefProperty = isKeyRef ? 'configMapKeyRef' : 'configMapRef';
  const secretRefProperty = isKeyRef ? 'secretKeyRef' : 'secretRef';

  _.each(configMaps.items, (v) => {
    cmItems[`${v.metadata.name}:${cmRefProperty}`] = <ResourceName kind="ConfigMap" name={v.metadata.name} />;
    if (kind === 'ConfigMap' && _.isEqual(v.metadata.name, name)) {
      refProperty = cmRefProperty;
      itemKeys = getKeys(v.data);
    }
  });
  _.each(secrets.items, (v) => {
    secretItems[`${v.metadata.name}:${secretRefProperty}`] = <ResourceName kind="Secret" name={v.metadata.name} />;
    if (kind === 'Secret' && _.isEqual(v.metadata.name, name)) {
      refProperty = secretRefProperty;
      itemKeys = getKeys(v.data);
    }
  });

  const firstConfigMap = _.isEmpty(cmItems) ? {} : Object.keys(cmItems)[0];
  const firstSecret = _.isEmpty(secretItems) ? {} : Object.keys(secretItems)[0];
  const headerBefore = getHeaders(firstConfigMap, firstSecret);
  const spacerBefore = getSpacer(firstConfigMap, firstSecret);
  const items = _.assign({}, cmItems, secretItems);
  return <React.Fragment>
    <Dropdown
      menuClassName="value-from__menu dropdown-menu--text-wrap"
      className="value-from"
      autocompleteFilter={nameAutocompleteFilter}
      autocompletePlaceholder={placeholderString}
      items={items}
      selectedKey={name}
      title={nameTitle}
      headerBefore={headerBefore}
      spacerBefore={spacerBefore}
      onChange={val => {
        const keyValuePair = _.split(val, ':');
        onChange({
          [keyValuePair[1]]:
            isKeyRef ? {'name': keyValuePair[0], 'key': ''} : {'name': keyValuePair[0]},
        });
      }}
    />{isKeyRef &&
    <Dropdown
      menuClassName="value-from__menu dropdown-menu--text-wrap"
      className="value-from value-from--key"
      autocompleteFilter={keyAutocompleteFilter}
      autocompletePlaceholder="Key"
      items={itemKeys}
      selectedKey={key}
      title={keyTitle}
      onChange={val => onChange({[refProperty]:{name, 'key': val}})}
    />}
  </React.Fragment>;
};

const FieldRef = ({data: {fieldPath}}) => <React.Fragment>
  <div className="pairs-list__value-ro-field">
    <input type="text" className="pf-c-form-control" value="FieldRef" disabled />
  </div>
  <div className="pairs-list__value-ro-field">
    <input type="text" className="pf-c-form-control" value={fieldPath} disabled />
  </div>
</React.Fragment>;

const ConfigMapSecretKeyRef = ({data: {name, key}, configMaps, secrets, onChange, disabled, kind}) => {
  const placeholderString = 'Config Map or Secret';
  const nameTitle = _.isEmpty(name) ? <span className="pf-c-dropdown__toggle-text--placeholder">Select a resource</span> : <ResourceName kind={kind} name={name} />;

  if (disabled) {
    return <React.Fragment>
      <div className="pairs-list__value-ro-field">
        <input type="text" className="pf-c-form-control" value={`${name} - ${kind}`} disabled />
      </div>
      <div className="pairs-list__value-ro-field">
        <input type="text" className="pf-c-form-control" value={key} disabled />
      </div>
    </React.Fragment>;
  }
  return NameKeyDropdownPair({name, key, configMaps, secrets, onChange, kind, nameTitle, placeholderString});
};

const ConfigMapSecretRef = ({data: {name, key}, configMaps, secrets, onChange, disabled, kind}) => {
  const placeholderString = 'Config Map or Secret';
  const nameTitle = _.isEmpty(name) ? <span className="pf-c-dropdown__toggle-text--placeholder">Select a resource</span> : <ResourceName kind={kind} name={name} />;
  const isKeyRef = false;
  const nameString = _.isEmpty(name) ? '' : `${name} - ${kind}`;

  if (disabled) {
    return <div className="pairs-list__value-ro-field">
      <input type="text" className="pf-c-form-control" value={nameString} disabled placeholder="config map/secret" />
    </div>;
  }
  return NameKeyDropdownPair({name, key, configMaps, secrets, onChange, kind, nameTitle, placeholderString, isKeyRef});
};

const ResourceFieldRef = ({data: {containerName, resource}}) => <React.Fragment>
  <div className="pairs-list__value-ro-field">
    <input type="text" className="pf-c-form-control value-from" value={`${containerName} - Resource Field`} disabled />
  </div>
  <div className="pairs-list__value-ro-field">
    <input type="text" className="pf-c-form-control value-from" value={resource} disabled />
  </div>
</React.Fragment>;

const keyStringToComponent = {
  fieldRef: {
    component: FieldRef,
  },
  secretKeyRef: {
    component: ConfigMapSecretKeyRef,
    kind: 'Secret',
  },
  configMapKeyRef: {
    component: ConfigMapSecretKeyRef,
    kind: 'ConfigMap',
  },
  configMapSecretKeyRef: {
    component: ConfigMapSecretKeyRef,
  },
  resourceFieldRef: {
    component: ResourceFieldRef,
  },
  configMapRef: {
    component: ConfigMapSecretRef,
    kind: 'ConfigMap',
  },
  secretRef: {
    component: ConfigMapSecretRef,
    kind: 'Secret',
  },
  configMapSecretRef: {
    component: ConfigMapSecretRef,
  },
};

export class ValueFromPair extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onChangeVal = (...args) => this._onChangeVal(...args);
  }

  _onChangeVal(value) {
    const {onChange} = this.props;
    const e = {'target': {value}};
    return onChange(e);
  }

  render() {
    const {pair, configMaps, secrets, disabled} = this.props;
    const valueFromKey = Object.keys(this.props.pair)[0];
    const componentInfo = keyStringToComponent[valueFromKey];
    const Component = componentInfo.component;

    return <Component data={pair[valueFromKey]} configMaps={configMaps} secrets={secrets} kind={componentInfo.kind} onChange={this.onChangeVal} disabled={disabled} />;
  }
}
ValueFromPair.propTypes = {
  pair: PropTypes.object.isRequired,
  configMaps: PropTypes.object,
  secrets: PropTypes.object,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
