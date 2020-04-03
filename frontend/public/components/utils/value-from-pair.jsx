import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';

import { Dropdown, ResourceName } from './';

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

const getHeaders = (configMap, secret, serviceAccount) => {
  const headers = {};
  if (configMap && !_.isEmpty(configMap)) {
    headers[configMap] = 'Config Maps';
  }
  if (secret && !_.isEmpty(secret)) {
    headers[secret] = 'Secrets';
  }
  if (serviceAccount && !_.isEmpty(serviceAccount)) {
    headers[serviceAccount] = 'Service Accounts';
  }

  return headers;
};

const getKeys = (keyMap) => {
  const itemKeys = {};
  _.mapKeys(keyMap, (value, key) => (itemKeys[key] = key));
  return itemKeys;
};

export const NameKeyDropdownPair = ({
  name,
  key,
  configMaps,
  secrets,
  serviceAccounts,
  onChange,
  kind,
  nameTitle,
  placeholderString,
  isKeyRef = true,
}) => {
  let itemKeys = {};
  let refProperty;
  const cmItems = {};
  const secretItems = {};
  const saItems = {};
  const nameAutocompleteFilter = (text, item) => fuzzy(text, item.props.name);
  const keyAutocompleteFilter = (text, item) => fuzzy(text, item);
  const keyTitle = _.isEmpty(key) ? 'Select a key' : key;
  const cmRefProperty = isKeyRef ? 'configMapKeyRef' : 'configMapRef';
  const secretRefProperty = isKeyRef ? 'secretKeyRef' : 'secretRef';
  const serviceAccountRefProperty = isKeyRef ? 'serviceAccountKeyRef' : 'serviceAccountRef';

  _.each(configMaps.items, (v) => {
    cmItems[`${v.metadata.name}:${cmRefProperty}`] = (
      <ResourceName kind="ConfigMap" name={v.metadata.name} />
    );
    if (kind === 'ConfigMap' && _.isEqual(v.metadata.name, name)) {
      refProperty = cmRefProperty;
      itemKeys = getKeys(v.data);
    }
  });
  _.each(secrets.items, (v) => {
    secretItems[`${v.metadata.name}:${secretRefProperty}`] = (
      <ResourceName kind="Secret" name={v.metadata.name} />
    );
    if (kind === 'Secret' && _.isEqual(v.metadata.name, name)) {
      refProperty = secretRefProperty;
      itemKeys = getKeys(v.data);
    }
  });
  serviceAccounts &&
    _.each(serviceAccounts.items, (v) => {
      saItems[`${v.metadata.name}:${serviceAccountRefProperty}`] = (
        <ResourceName kind="ServiceAccount" name={v.metadata.name} />
      );
      if (kind === 'ServiceAccount' && _.isEqual(v.metadata.name, name)) {
        refProperty = serviceAccountRefProperty;
        itemKeys = getKeys(v.data);
      }
    });

  const firstConfigMap = _.isEmpty(cmItems) ? {} : Object.keys(cmItems)[0];
  const firstSecret = _.isEmpty(secretItems) ? {} : Object.keys(secretItems)[0];
  const firstServiceAccount = saItems && !_.isEmpty(saItems) ? Object.keys(saItems)[0] : {};
  const headerBefore = getHeaders(firstConfigMap, firstSecret, firstServiceAccount);
  const spacerBefore = getSpacer(firstConfigMap, firstSecret);
  const items = _.assign({}, cmItems, secretItems, saItems);
  return (
    <>
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
        onChange={(val) => {
          const keyValuePair = _.split(val, ':');
          onChange({
            [keyValuePair[1]]: isKeyRef
              ? { name: keyValuePair[0], key: '' }
              : { name: keyValuePair[0] },
          });
        }}
      />
      {isKeyRef && (
        <Dropdown
          menuClassName="value-from__menu dropdown-menu--text-wrap"
          className="value-from value-from--key"
          autocompleteFilter={keyAutocompleteFilter}
          autocompletePlaceholder="Key"
          items={itemKeys}
          selectedKey={key}
          title={keyTitle}
          onChange={(val) => onChange({ [refProperty]: { name, key: val } })}
        />
      )}
    </>
  );
};

const FieldRef = ({ data: { fieldPath } }) => (
  <>
    <div className="pairs-list__value-ro-field">
      <input type="text" className="pf-c-form-control" value="FieldRef" disabled />
    </div>
    <div className="pairs-list__value-ro-field">
      <input type="text" className="pf-c-form-control" value={fieldPath} disabled />
    </div>
  </>
);

const ConfigMapSecretKeyRef = ({
  data: { name, key },
  configMaps,
  secrets,
  serviceAccounts,
  onChange,
  disabled,
  kind,
}) => {
  const placeholderString = 'Config Map or Secret';
  const nameTitle = _.isEmpty(name) ? (
    'Select a resource'
  ) : (
    <ResourceName kind={kind} name={name} />
  );

  if (disabled) {
    return (
      <>
        <div className="pairs-list__value-ro-field">
          <input type="text" className="pf-c-form-control" value={`${name} - ${kind}`} disabled />
        </div>
        <div className="pairs-list__value-ro-field">
          <input type="text" className="pf-c-form-control" value={key} disabled />
        </div>
      </>
    );
  }
  return NameKeyDropdownPair({
    name,
    key,
    configMaps,
    secrets,
    serviceAccounts,
    onChange,
    kind,
    nameTitle,
    placeholderString,
  });
};

const ConfigMapSecretRef = ({
  data: { name, key },
  configMaps,
  secrets,
  serviceAccounts,
  onChange,
  disabled,
  kind,
}) => {
  const placeholderString = 'Config Map or Secret';
  const nameTitle = _.isEmpty(name) ? (
    'Select a resource'
  ) : (
    <ResourceName kind={kind} name={name} />
  );
  const isKeyRef = false;
  const nameString = _.isEmpty(name) ? '' : `${name} - ${kind}`;

  if (disabled) {
    return (
      <div className="pairs-list__value-ro-field">
        <input
          type="text"
          className="pf-c-form-control"
          value={nameString}
          disabled
          placeholder="config map/secret"
        />
      </div>
    );
  }
  return NameKeyDropdownPair({
    name,
    key,
    configMaps,
    secrets,
    serviceAccounts,
    onChange,
    kind,
    nameTitle,
    placeholderString,
    isKeyRef,
  });
};

const ResourceFieldRef = ({ data: { containerName, resource } }) => (
  <>
    <div className="pairs-list__value-ro-field">
      <input
        type="text"
        className="pf-c-form-control value-from"
        value={`${containerName} - Resource Field`}
        disabled
      />
    </div>
    <div className="pairs-list__value-ro-field">
      <input type="text" className="pf-c-form-control value-from" value={resource} disabled />
    </div>
  </>
);

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
  serviceAccountRef: {
    component: ConfigMapSecretRef,
    kind: 'ServiceAccount',
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
    const { onChange } = this.props;
    const e = { target: { value } };
    return onChange(e);
  }

  render() {
    const { pair, configMaps, secrets, serviceAccounts, disabled } = this.props;
    const valueFromKey = Object.keys(this.props.pair)[0];
    const componentInfo = keyStringToComponent[valueFromKey];
    const Component = componentInfo.component;

    return (
      <Component
        data={pair[valueFromKey]}
        configMaps={configMaps}
        secrets={secrets}
        serviceAccounts={serviceAccounts}
        kind={componentInfo.kind}
        onChange={this.onChangeVal}
        disabled={disabled}
      />
    );
  }
}
ValueFromPair.propTypes = {
  pair: PropTypes.object.isRequired,
  configMaps: PropTypes.object,
  secrets: PropTypes.object,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
