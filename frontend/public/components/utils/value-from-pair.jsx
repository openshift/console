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
    [secret]: 'Secrets'
  };
};

const getKeys = (keyMap) => {
  const itemKeys = {};
  _.mapKeys(keyMap, (value, key) => itemKeys[key] = key);
  return itemKeys;
};

const NameKeyDropdownPair = ({name, key, configMaps, secrets, onChange, kind, nameTitle, placeholderString}) => {
  let itemKeys = {};
  let keyRefString;
  const cmItems = {};
  const secretItems = {};
  const nameAutocompleteFilter = (text, item) => fuzzy(text, item.props.name);
  const keyAutocompleteFilter = (text, item) => fuzzy(text, item);
  const keyTitle = _.isEmpty(key) ? <span className="text-muted">Select a key</span> : <span>{key}</span>;

  _.each(configMaps.items, (v) => {
    cmItems[`${v.metadata.name}:configMapKeyRef`] = <ResourceName kind="ConfigMap" name={v.metadata.name} />;
    if (kind === 'ConfigMap' && _.isEqual(v.metadata.name, name)) {
      keyRefString = 'configMapKeyRef';
      itemKeys = getKeys(v.data);
    }
  });
  _.each(secrets.items, (v) => {
    secretItems[`${v.metadata.name}:secretKeyRef`] = <ResourceName kind="Secret" name={v.metadata.name} />;
    if (kind === 'Secret' && _.isEqual(v.metadata.name, name)) {
      keyRefString = 'secretKeyRef';
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
      menuClassName="co-namespace-selector__menu"
      className="value-from-pair"
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
            {'name': keyValuePair[0], 'key': ''}
        });
      }}
    />
    <Dropdown
      menuClassName="co-namespace-selector__menu"
      className="value-from-pair"
      autocompleteFilter={keyAutocompleteFilter}
      autocompletePlaceholder="Key"
      items={itemKeys}
      selectedKey={key}
      title={keyTitle}
      onChange={val => onChange({[keyRefString]:{'name': name, 'key': val}})}
    />
  </React.Fragment>;
};

const FieldRef = ({data: {fieldPath}}) => <span>
  <input type="text" className="form-control value-from-pair" value="FieldRef" disabled />
  <input type="text" className="form-control value-from-pair" value={fieldPath} disabled />
</span>;

const ConfigMapSecretKeyRef = ({data: {name, key}, configMaps, secrets, onChange, disabled, kind}) => {
  const placeholderString = 'Config Map or Secret';
  const nameTitle = _.isEmpty(name) ? <span className="text-muted">Select a resource</span> : <ResourceName kind={kind} name={name} />;

  if (disabled) {
    return <span>
      <input type="text" className="form-control value-from-pair" value={`${name} - ${kind}`} disabled />
      <input type="text" className="form-control value-from-pair" value={key} disabled />
    </span>;
  }
  return NameKeyDropdownPair({name, key, configMaps, secrets, onChange, kind, nameTitle, placeholderString});
};

const ResourceFieldRef = ({data: {containerName, resource}}) => <span>
  <input type="text" className="form-control value-from-pair" value={`${containerName} - Resource Field`} disabled />
  <input type="text" className="form-control value-from-pair" value={resource} disabled />
</span>;

const keyStringToComponent = {
  fieldRef: FieldRef,
  secretKeyRef: {
    component: ConfigMapSecretKeyRef,
    kind: 'Secret'
  },
  configMapKeyRef: {
    component: ConfigMapSecretKeyRef,
    kind: 'ConfigMap'
  },
  configMapSecretKeyRef: {
    component: ConfigMapSecretKeyRef
  },
  resourceFieldRef: ResourceFieldRef,
};

export class ValueFromPair extends React.PureComponent {
  constructor (props) {
    super(props);

    this.onChangeVal = (...args) => this._onChangeVal(...args);
  }

  _onChangeVal(value) {
    const {onChange} = this.props;
    const e = {'target': {value}};
    return onChange(e);
  }

  render () {
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
  disabled: PropTypes.bool
};
