import type { FC, ReactElement, ReactNode } from 'react';
import * as _ from 'lodash';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';

import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { ResourceName } from './resource-icon';

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

type K8sItemList = {
  items?: Array<{
    metadata: { name: string };
    data?: Record<string, string>;
  }>;
};

type RefValue = {
  name: string;
  key?: string;
  pairKey?: string;
};

export type RefChangeValue = Record<string, RefValue>;

type FieldRefData = {
  fieldPath: string;
};

type ResourceFieldRefData = {
  containerName: string;
  resource: string;
};

type NameKeyDropdownPairProps = {
  name: string;
  pairKey: string;
  configMaps: K8sItemList;
  secrets: K8sItemList;
  serviceAccounts?: K8sItemList;
  onChange: (value: RefChangeValue) => void;
  kind: string;
  nameTitle: ReactNode;
  placeholderString: string;
  isKeyRef?: boolean;
};

type ConfigMapSecretProps = {
  data: RefValue;
  configMaps: K8sItemList;
  secrets: K8sItemList;
  serviceAccounts?: K8sItemList;
  onChange: (value: RefChangeValue) => void;
  disabled: boolean;
  kind: string;
};

type RefComponentProps = {
  data: FieldRefData | ResourceFieldRefData | RefValue;
  configMaps?: K8sItemList;
  secrets?: K8sItemList;
  serviceAccounts?: K8sItemList;
  kind?: string;
  onChange?: (value: RefChangeValue) => void;
  disabled?: boolean;
};

type ComponentInfo = {
  component: FC<RefComponentProps>;
  kind?: string;
};

export type PairValue = string | number | Record<string, unknown>;

export type ValueFromPairProps = {
  pair: PairValue;
  configMaps?: K8sItemList;
  secrets?: K8sItemList;
  serviceAccounts?: K8sItemList;
  onChange?: (e: { target: { value: RefChangeValue } }) => void;
  disabled?: boolean;
};

const getSpacer = (
  configMap: string | Record<never, never>,
  secret: string | Record<never, never>,
) => {
  const spacerBefore = new Set<string>();
  return _.isEmpty(configMap) || _.isEmpty(secret)
    ? spacerBefore
    : spacerBefore.add(secret as string);
};

const getKeys = (keyMap: Record<string, string> | undefined) => {
  const itemKeys: Record<string, string> = {};
  _.mapKeys(keyMap, (value, key) => (itemKeys[key] = key));
  return itemKeys;
};

const NameKeyDropdownPair: FC<NameKeyDropdownPairProps> = ({
  name,
  pairKey,
  configMaps,
  secrets,
  serviceAccounts,
  onChange,
  kind,
  nameTitle,
  placeholderString,
  isKeyRef = true,
}) => {
  const { t } = useTranslation();

  const getHeaders = (
    configMap: string | Record<never, never>,
    secret: string | Record<never, never>,
    serviceAccount: string | Record<never, never>,
  ) => {
    const headers: Record<string, string> = {};
    if (configMap && !_.isEmpty(configMap)) {
      headers[configMap as string] = t('public~ConfigMaps');
    }
    if (secret && !_.isEmpty(secret)) {
      headers[secret as string] = t('public~Secrets');
    }
    if (serviceAccount && !_.isEmpty(serviceAccount)) {
      headers[serviceAccount as string] = t('public~ServiceAccounts');
    }

    return headers;
  };

  let itemKeys: Record<string, string> = {};
  let refProperty: string;
  const cmItems: Record<string, ReactNode> = {};
  const secretItems: Record<string, ReactNode> = {};
  const saItems: Record<string, ReactNode> = {};
  const nameAutocompleteFilter = (text: string, item: ReactElement) => fuzzy(text, item.props.name);
  const keyAutocompleteFilter = (text: string, item: string) => fuzzy(text, item);
  const keyTitle = _.isEmpty(pairKey) ? t('public~Select a key') : pairKey;
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
      <ConsoleSelect
        menuClassName="value-from__menu dropdown-menu--text-wrap"
        className="value-from"
        autocompleteFilter={nameAutocompleteFilter}
        autocompletePlaceholder={placeholderString}
        items={items}
        selectedKey={name}
        alwaysShowTitle
        title={nameTitle}
        headerBefore={headerBefore}
        spacerBefore={spacerBefore}
        onChange={(val) => {
          const keyValuePair = _.split(val, ':');
          onChange({
            [keyValuePair[1]]: isKeyRef
              ? { name: keyValuePair[0], pairKey: '' }
              : { name: keyValuePair[0] },
          });
        }}
      />
      {isKeyRef && (
        <ConsoleSelect
          menuClassName="value-from__menu dropdown-menu--text-wrap"
          className="value-from value-from--key"
          autocompleteFilter={keyAutocompleteFilter}
          autocompletePlaceholder={t('public~Key')}
          items={itemKeys}
          selectedKey={pairKey}
          alwaysShowTitle
          title={keyTitle}
          onChange={(val) => onChange({ [refProperty]: { name, key: val } })}
        />
      )}
    </>
  );
};

const FieldRef: FC<{ data: FieldRefData }> = ({ data: { fieldPath } }) => (
  <>
    <div className="pairs-list__value-ro-field">
      <span className="pf-v6-c-form-control pf-m-disabled">
        <input type="text" value="FieldRef" disabled />
      </span>
    </div>
    <div className="pairs-list__value-ro-field">
      <span className="pf-v6-c-form-control pf-m-disabled">
        <input type="text" value={fieldPath} disabled />
      </span>
    </div>
  </>
);

const ConfigMapSecretKeyRef: FC<ConfigMapSecretProps> = ({
  data: { name, key },
  configMaps,
  secrets,
  serviceAccounts,
  onChange,
  disabled,
  kind,
}) => {
  const { t } = useTranslation();
  const placeholderString = t('public~ConfigMap or Secret');
  const nameTitle = _.isEmpty(name) ? (
    t('public~Select a resource')
  ) : (
    <ResourceName kind={kind} name={name} />
  );

  if (disabled) {
    return (
      <>
        <div className="pairs-list__value-ro-field">
          <span className="pf-v6-c-form-control pf-m-disabled">
            <input type="text" value={`${name} - ${kind}`} disabled />
          </span>
        </div>
        <div className="pairs-list__value-ro-field">
          <span className="pf-v6-c-form-control pf-m-disabled">
            <input type="text" value={key} disabled />
          </span>
        </div>
      </>
    );
  }
  return (
    <NameKeyDropdownPair
      pairKey={key}
      name={name}
      configMaps={configMaps}
      secrets={secrets}
      serviceAccounts={serviceAccounts}
      onChange={onChange}
      kind={kind}
      nameTitle={nameTitle}
      placeholderString={placeholderString}
    />
  );
};

const ConfigMapSecretRef: FC<ConfigMapSecretProps> = ({
  data: { name, key },
  configMaps,
  secrets,
  serviceAccounts,
  onChange,
  disabled,
  kind,
}) => {
  const { t } = useTranslation();
  const placeholderString = t('public~ConfigMap or Secret');
  const nameTitle = _.isEmpty(name) ? (
    t('public~Select a resource')
  ) : (
    <ResourceName kind={kind} name={name} />
  );
  const isKeyRef = false;
  const nameString = _.isEmpty(name) ? '' : `${name} - ${kind}`;

  if (disabled) {
    return (
      <div className="pairs-list__value-ro-field">
        <span className="pf-v6-c-form-control pf-m-disabled">
          <input
            type="text"
            value={nameString}
            disabled
            placeholder={t('public~ConfigMap/Secret')}
          />
        </span>
      </div>
    );
  }
  return (
    <NameKeyDropdownPair
      pairKey={key}
      name={name}
      configMaps={configMaps}
      secrets={secrets}
      serviceAccounts={serviceAccounts}
      onChange={onChange}
      kind={kind}
      nameTitle={nameTitle}
      placeholderString={placeholderString}
      isKeyRef={isKeyRef}
    />
  );
};

const ResourceFieldRef: FC<{ data: ResourceFieldRefData }> = ({
  data: { containerName, resource },
}) => (
  <>
    <div className="pairs-list__value-ro-field">
      <span className="pf-v6-c-form-control pf-m-disabled">
        <input
          type="text"
          className="value-from"
          value={`${containerName} - Resource Field`}
          disabled
        />
      </span>
    </div>
    <div className="pairs-list__value-ro-field">
      <span className="pf-v6-c-form-control pf-m-disabled">
        <input type="text" className="value-from" value={resource} disabled />
      </span>
    </div>
  </>
);

const keyStringToComponent: Record<string, ComponentInfo> = {
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

export const ValueFromPair: FC<ValueFromPairProps> = ({
  pair,
  configMaps,
  secrets,
  serviceAccounts,
  onChange,
  disabled,
}) => {
  const valueFromKey = Object.keys(pair)[0];
  const componentInfo = keyStringToComponent[valueFromKey];
  if (!componentInfo) {
    return null;
  }

  const Component = componentInfo.component;
  return (
    <Component
      data={pair[valueFromKey]}
      configMaps={configMaps}
      secrets={secrets}
      serviceAccounts={serviceAccounts}
      kind={componentInfo.kind}
      onChange={(value: RefChangeValue) => onChange?.({ target: { value } })}
      disabled={disabled}
    />
  );
};
