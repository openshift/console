import * as React from 'react';
import { Link } from 'react-router-dom';
import { ActionGroup, Button, Switch } from '@patternfly/react-core';
import { ButtonBar, history, resourcePathFromModel } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { SecretModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s';
import { BaremetalHostModel } from '../models';

interface AddHostFormFields {
  name: string;
  managementAddress: string;
  username: string;
  password: string;
  online: boolean;
}

const initFormFields = (
  name = '',
  managementAddress = '',
  username = '',
  password = '',
  online = false,
): AddHostFormFields => ({
  name,
  managementAddress,
  username,
  password,
  online,
});

const getSecretName = (name) => `${name}-secret`;

const buildSecret = (name, namespace, username, password) => ({
  apiVersion: SecretModel.apiVersion,
  kind: SecretModel.kind,
  metadata: {
    namespace,
    name,
  },
  data: {
    username: btoa(username),
    password: btoa(password),
  },
  type: 'Opaque',
});

const buildBaremetalHostObject = (name, namespace, managementAddress, online) => ({
  apiVersion: `${BaremetalHostModel.apiGroup}/${BaremetalHostModel.apiVersion}`,
  kind: BaremetalHostModel.kind,
  metadata: {
    name,
    namespace,
  },
  spec: {
    online,
    bmc: {
      address: managementAddress,
      credentialsName: getSecretName(name),
    },
    hardwareProfile: 'dell',
  },
});

const AddHost: React.FC = () => {
  const title = 'Create Bare Metal Host';

  const [formValue, setFormValue] = React.useState(initFormFields());
  const [inProgress, setProgress] = React.useState(false);
  const [error, setError] = React.useState('');
  const createBaremetalHost = async (secret, bmo) => {
    const results = [];
    results.push(await k8sCreate(SecretModel, secret));
    results.push(await k8sCreate(BaremetalHostModel, bmo));
    return results;
  };

  const handleChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.currentTarget;
    setFormValue((prevState) => ({ ...prevState, [name]: value }));
  };

  const setOnlineState = (onlineState) =>
    setFormValue((prevState) => ({ ...prevState, online: onlineState }));

  const submit = (event) => {
    event.preventDefault();
    setProgress(true);
    setError('');
    const { name, managementAddress, username, password, online } = formValue;
    const namespace = getActiveNamespace();
    const secret = buildSecret(getSecretName(name), namespace, username, password);
    const bmo = buildBaremetalHostObject(name, namespace, managementAddress, online);
    createBaremetalHost(secret, bmo)
      .then(() => {
        setProgress(false);
        history.push(resourcePathFromModel(BaremetalHostModel, name, namespace));
      })
      .catch(({ message }) => {
        setProgress(false);
        setError(message);
      });
  };

  return (
    <React.Fragment>
      <div className="co-m-pane__body co-m-pane__form">
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">{title}</div>
        </h1>

        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="name" className="control-label co-required">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="managementAddress" className="control-label co-required">
              Management Controller Address
            </label>
            <input
              id="managementAddress"
              name="managementAddress"
              type="text"
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username" className="control-label co-required">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="control-label co-required">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="formGroup">
            <p>
              <Switch
                id="host-online"
                label={`Host will be ${formValue.online ? 'online' : 'offline'} after creation.`}
                isChecked={formValue.online}
                onChange={setOnlineState}
              />
            </p>
          </div>

          <ButtonBar errorMessage={error} inProgress={inProgress}>
            <ActionGroup className="pf-c-form">
              <Button
                type="submit"
                disabled={
                  !formValue.name ||
                  !formValue.managementAddress ||
                  !formValue.username ||
                  !formValue.password
                }
                className="btn btn-primary"
                id="save-changes"
              >
                Create
              </Button>
              <Link
                to={`/k8s/ns/${getActiveNamespace()}/baremetalhosts`}
                className="pf-c-button pf-m-secondary"
                id="cancel"
              >
                Cancel
              </Link>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    </React.Fragment>
  );
};

export default AddHost;
