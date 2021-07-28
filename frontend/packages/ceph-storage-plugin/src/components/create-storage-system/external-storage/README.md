### Contributing to the ODF UI:


OpenShift Data Foundation (ODF) operator supports connecting to an external vendor storage system.

All external vendors can contribute their UI via the `Create storage class` step of `CreateStorageSystem` wizard.

Follow the steps written below to integrate with the ODF wizard:


1. Any new external storage vendor would require to add a new entry to  [`SUPPORTED_EXTERNAL_STORAGE`](https://github.com/openshift/console/blob/master/frontend/packages/ceph-storage-plugin/src/components/create-storage-system/external-storage/index.ts) with the following details:
```js
/**
 *  Configures a new external storage vendor to the Storage System Creation wizard.
 */
export type ExternalStorage = {
  /** Display name of the external storage vendor. */
  displayName: string;

  /** The model referring the `apiGroup`,`apiVersion`, `plural` and `kind` of the external storage vendor's CRD. */
  model: Model;

  /** A React Functional Component to input the connection details of the external storage vendor. */
  Component: React.FunctionComponent<ExternalComponentProps<{}>>;

  /**  Handler function to create external storage storage vendor CR or resources. */
  createPayload: CreatePayload<{}>;

  /**  Handler function to validate the storage class page in order to move to the next step of wizard */
  canGoToNextStep: CanGoToNextStep<{}>;
};

```

```js

  /** The model referring the `apiGroup`,`apiVersion`, `plural` and `kind` of the external storage vendor's CRD. */

type Model = {
    /* apiGroup of the external provider CRD */
    apiGroup: string;

    /* apiVersion of the external provider CRD */
    apiVersion: string;

    /* kind of the external provider CRD */
    kind: string;

    /* plural of the external provider CRD */
    plural: string;

}

/** Props for `ExternalStorage.Component` to input the connection details of the external storage vendor. */

export type ExternalComponentProps<S extends ExternalState> = {
  /** The state of the `ExternalStorage.Component`. */
  formState: S;

  /** The callback for setting the state of `ExternalStorage.Component` */
  setFormState: (field: string, value: ExternalStateValues) => void;

  /** The translation function for externalizing the text. */
  t: TFunction;
};

```

```js
/**
 *  @function CreatePayload<S>
 *
 *    @param {string} systemName
 *    The name of the external storage system requried for the creation of the external custom resource.
 *
 *    @param {S extends ExternalState} state
 *    The other fields of the create storage class form.
 *
 *    @param {ExtensionK8sModel} model
 *    The model referring the `apiGroup`,`apiVersion` and `kind` of the external storage vendor's CRD.
 *
 *    @param {string} storageClassName
 *    The name of the of the storage class.
 *
 *    @returns {Payload} An array of payloads of `Payload` type.
 */
 type CreatePayload<S extends ExternalState> = (
  systemName: string,
  state: S,
  model: ExtensionK8sModel,
  storageClassName: string,
) => Payload[];

type Payload = { model: ExtensionK8sModel; payload: K8sResourceKind };

```

```js 

/**
 *  @function CanGoToNextStep<S>
 *
 *    @param {S extends ExternalState} state
 *    The other fields of the create storage class form.
 *
 *    @param {string} storageClassName
 *    The name of the of the storage class.
 *
 *    @returns {boolean} A boolean value.
 */
type CanGoToNextStep<S extends ExternalState> = (
  state: S,
  storageClassName: string,
) => boolean;

```
     
2. Create a new folder under: `./src/components/create-storage-system/external-storage/{new-external-storage}`

3. Define an `index.tsx` file under the newly created folder. 

4. Create `Component`, `createPayload` and  `canGoToNextStep` in the created file above. Some guidelines for `Component`:

* The Component is required to only include the connection details e.g IP Address, username, password, etc related to the external storage. The Storage Class field is generic for all external Providers and is not required to be duplicated by any external vendor's Component.
* The Component must use the [Patternfly's form components](https://www.patternfly.org/v4/components/form) e.g `FormGroup`, `TextInput`, `Radio` to make the design consistent with the rest of the wizard and OpenShift console.
* All form components should be controlled forms i.e using `onChange` event handler to control the value of the input elements.
* The component should externalize the strings for i18n by namespace: `ceph-storage-plugin~`  . [See usage](https://github.com/openshift/console/blob/master/frontend/packages/ceph-storage-plugin/src/components/ocs-install/existing-cluster-modal.tsx#L17).

5. Define and export the `type` of Component's state in `./src/components/create-storage-system/external-storage/types.ts`

6. Add the new external storage vendor configuration to [`SUPPORTED_EXTERNAL_STORAGE`](https://github.com/openshift/console/blob/master/frontend/packages/ceph-storage-plugin/src/components/create-storage-system/external-storage/index.ts)


#### Example:


```js

/* Add new state for the Component*/

export type ExternalState = {} | RHCSState | ABCState // new state  

export type RHCSState = {
  fileData: string;
  isRejected: boolean;
  isLoading: boolean;
  fileName: string;
};

export type ABCStorageState = { // new state
  username: string;
  nodes: string;
};
```


```js

/* Create `Component`, `createPayload` and  `canGoToNextStep` */

import * as React from 'react';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';

import { ComponentProps, CreatePayload, ABCStorageState } from '../types';

export const ABCStorage: React.FC<ExternalComponentProps<ABCStorageState>> = ({ form, setForm, t }) => {
  return (
    <Form>
      <FormGroup label={t('ceph-storage-plugin~Username')} fieldId="username-input">
        <TextInput
          id="username-input"
          value={form.username}
          type="text"
          onChange={(value: string) => setForm('username', value)}
        />
      </FormGroup>
    </Form>
  );
};

export const createAbcPayload: CreatePayload<ABCStorageState> = (name, storageClass, form, model) => [
  {
    model,
    payload: {
      apiVersion: model.version,
      kind: model.kind,
      metadata: {
        name,
      },
      spec: {
        storageClass,
        username: form.username,
      },
    },
  },
];


export const abcCanGoToNextStep: CanGoToNextStep<ABCStorageState> = (state) =>
  !!state.userName;
```

```js

/* Adding the new entry into External Storage */

export const SUPPORTED_EXTERNAL_STORAGE: ExternalStorage[] = [
  {
    displayName: 'ABC Storage',
    model: {
      group: 'abc.openshift.io',
      version: 'v1',
      kind: 'ABC',
    },
    Component: ABCStorage,
    createPayload: createAbcPayload,
    canGoToNextStep: abcCanGoToNextStep,
  },
];
```
