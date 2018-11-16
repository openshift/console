/* eslint-disable no-undef, no-unused-vars */
import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';

import { connectToPlural } from '../../kinds';
import {
  k8sCreate,
  k8sGet,
  K8sKind,
  K8sResourceKind,
  k8sUpdate,
  referenceFor,
} from '../../module/k8s';
import {
  ButtonBar,
  history,
  ListDropdown,
  LoadingBox,
  ResourceLink,
  resourceObjPath,
} from '../utils';
import { Checkbox } from '../checkbox';
import { RadioInput } from '../radio';
import { CreatePVCForm } from '../storage/create-pvc';
import { PersistentVolumeClaimModel } from '../../models/index';

const PVCDropdown: React.SFC<PVCDropdownProps> = props => {
  const kind = 'PersistentVolumeClaim';
  const { namespace, selectedKey, required, name } = props;
  const resources = [{ kind, namespace }];
  return (
    <ListDropdown
      {...props}
      desc="Persistent Volume Claim"
      resources={resources}
      selectedKeyKind={kind}
      placeholder="Select claim"
      selectedKey={selectedKey}
      required={required}
      namespace={namespace}
      name={name}
    />
  );
};

class AttachStorageForm extends React.Component<
  AttachStorageFormProps,
  AttachStorageFormState
  > {
  state = {
    resourceObj: null,
    inProgress: false,
    claimName: '',
    volumeName: '',
    mountPath: '',
    subPath: '',
    mountAsReadOnly: false,
    allContainers: true,
    containers: {},
    volumeAlreadyMounted: false,
    error: '',
    showCreatePVC: 'existing',
    newPVCObj: null,
  };

  componentDidMount() {
    const { kindObj, name, namespace } = this.props;
    const supportedKinds = [
      'Deployment',
      'DeploymentConfig',
      'ReplicaSet',
      'ReplicationController',
    ];

    if (!kindObj || !_.includes(supportedKinds, kindObj.kind)) {
      this.setState({ error: 'Unsupported kind.' });
      return;
    }

    // Get the current resource so we can add to its definition
    k8sGet(kindObj, name, namespace).then(
      resourceObj => {
        this.setState({ resourceObj });
      },
      err => this.setState({ error: err.message })
    );
  }

  updateVolumeName = (claimName: string) => {
    const { resourceObj } = this.state;
    // Check if there is already a volume for this PVC.
    const volumes = _.get(resourceObj, 'spec.template.spec.volumes');
    const volume = _.find(volumes, {
      persistentVolumeClaim: {
        claimName: claimName,
      },
    }) as any;

    const volumeName = volume ? volume.name : claimName;
    const volumeAlreadyMounted = !!volume;
    this.setState({ volumeName, volumeAlreadyMounted });
  };

  handleChange: React.ReactEventHandler<HTMLInputElement> = event => {
    const { name, value } = event.currentTarget;
    this.setState({ [name]: value } as any);
  };

  // Add logic to check this handler for if a mount path is not unique
  handleMountPathChange: React.ReactEventHandler<HTMLInputElement> = event => {
    const { value: mountPath } = event.currentTarget;
    this.setState({ mountPath });
    // Look at the existing mount paths so that we can warn if the new value is not unique.
    this.checkMountPaths(mountPath);
  };

  handlePVCChange = (claimName: string) => {
    this.updateVolumeName(claimName);
    this.setState({ claimName });
  };

  onMountAsReadOnlyChanged: React.ReactEventHandler<HTMLInputElement> = () => {
    this.setState({ mountAsReadOnly: !this.state.mountAsReadOnly });
  };

  createPVCIfNecessary(): Promise<string> {
    const { showCreatePVC, newPVCObj, claimName } = this.state;
    return showCreatePVC === 'new'
      ? k8sCreate(PersistentVolumeClaimModel, newPVCObj).then(claim => claim.metadata.name)
      : Promise.resolve(claimName);
  }

  save = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    const { kindObj } = this.props;
    const {
      resourceObj: originalObj,
      volumeName,
      mountPath,
      subPath,
      mountAsReadOnly,
      volumeAlreadyMounted,
    } = this.state;
    const { metadata } = originalObj;
    const resourceObj = _.cloneDeep(originalObj);
    const template = resourceObj.spec.template;

    // For each container in the pod spec, add the new volume mount.
    _.each(template.spec.containers, container => {
      if (!this.isContainerSelected(container)) {
        return;
      }
      if (!container.volumeMounts) {
        container.volumeMounts = [];
      }
      container.volumeMounts.push({
        name: volumeName,
        mountPath,
        subPath,
        readOnly: mountAsReadOnly,
      });
    });

    this.setState({ inProgress: true });
    this.createPVCIfNecessary().then(claimName => {
      // add new volume to the pod template if not preent
      if (!volumeAlreadyMounted) {
        template.spec.volumes = template.spec.volumes || [];
        template.spec.volumes.push({
          name: volumeName,
          persistentVolumeClaim: {
            claimName,
          },
        });
      }
      k8sUpdate(kindObj, resourceObj, metadata.namespace, metadata.name).then(
        resource => {
          this.setState({ inProgress: false });
          history.push(resourceObjPath(resource, referenceFor(resource)));
        },
        err => this.setState({ error: err.message, inProgress: false })
      );
    }, err => this.setState({ error: err.message, inProgress: false }));

  };

  onPVCChange = newPVCObj => {
    this.setState({ newPVCObj });
    this.updateVolumeName(_.get(newPVCObj, 'metadata.name', ''));
  };

  isContainerSelected = ({ name }) => {
    const { allContainers, containers } = this.state;
    return allContainers || containers[name];
  };

  getMountPaths(podTemplate: any): string[] {
    const containers = _.get(podTemplate, 'spec.containers', []);
    return containers.reduce((acc, container) => {
      if (!this.isContainerSelected(container)) {
        return acc;
      }
      const mountPaths = _.map(container.volumeMounts, 'mountPath');
      return acc.concat(mountPaths);
    }, []);
  }

  checkMountPaths = (path: string) => {
    const existingMountPaths = this.getMountPaths(
      this.state.resourceObj.spec.template
    );
    const error =
      existingMountPaths.indexOf(path) > -1
        ? 'Mount path is already in use.'
        : '';
    this.setState({ error });
  };

  render() {
    const { kindObj, name, namespace } = this.props;
    const {
      claimName,
      mountPath,
      subPath,
      inProgress,
      error,
    } = this.state;
    const title = 'Add Storage';
    return (
      <div className="co-m-pane__body">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form
          className="co-m-pane__body-group co-create-secret-form"
          onSubmit={this.save}
        >
          <h1 className="co-m-pane__heading">{title}</h1>
          {kindObj && (
            <div className="co-m-pane__explanation">
              Add a persistent volume claim to <ResourceLink inline kind={kindObj.kind} name={name} namespace={namespace} />
            </div>
          )}
          <label className="control-label co-required" >
            Persistent Volume Claim
          </label>
          <div className="form-group">
            <RadioInput
              title="Use existing claim"
              value="existing"
              key="existing"
              onChange={this.handleChange}
              checked={this.state.showCreatePVC === 'existing'}
              name="showCreatePVC"
            />
          </div>

          {this.state.showCreatePVC === 'existing' &&
            <div className="form-group co-form-subsection">
              <PVCDropdown
                namespace={namespace}
                onChange={this.handlePVCChange}
                id="claimName"
                name="claimName"
                selectedKey={claimName}
                required
              />
            </div>
          }
          <div className="form-group">
            <RadioInput
              title="Create new claim"
              value="new"
              key="new"
              onChange={this.handleChange}
              checked={this.state.showCreatePVC === 'new'}
              name="showCreatePVC"
            />
          </div>

          {this.state.showCreatePVC === 'new' && <div className="co-form-subsection"><CreatePVCForm onChange={this.onPVCChange} namespace={this.props.namespace} /></div>}

          <div className="form-group">
            <label className="control-label co-required" htmlFor="mount-path">
              Mount Path
            </label>
            <div>
              <input
                className="form-control"
                type="text"
                onChange={this.handleMountPathChange}
                aria-describedby="mount-path-help"
                name="mountPath"
                id="mount-path"
                value={mountPath}
                required
              />
              <p className="help-block" id="mount-path-help">
                Mount path for the volume inside the container.
              </p>
            </div>
          </div>
          <Checkbox
            label="Mount as read-only"
            onChange={this.onMountAsReadOnlyChanged}
            checked={this.state.mountAsReadOnly}
            name="mountAsReadOnly"
          />
          <div className="form-group">
            <label className="control-label" htmlFor="subpath">
              Subpath
            </label>
            <div>
              <input
                className="form-control"
                type="text"
                onChange={this.handleChange}
                aria-describedby="subpath-help"
                id="subpath"
                name="subPath"
                value={subPath}
              />
              <p className="help-block" id="subpath-help">
                Optional path within the volume from which it will be mounted
                into the container. Defaults to the root of volume.
              </p>
            </div>
          </div>
          <ButtonBar errorMessage={error} inProgress={inProgress}>
            <button type="submit" className="btn btn-primary" id="save-changes">
              Save
            </button>
            <button
              type="button"
              className="btn btn-default"
              onClick={history.goBack}
            >
              Cancel
            </button>
          </ButtonBar>
        </form>
      </div>
    );
  }
}

const AttachStorage_ = ({ kindObj, kindsInFlight, match: { params } }) => {
  if (!kindObj && kindsInFlight) {
    return <LoadingBox />;
  }

  return (
    <AttachStorageForm
      namespace={params.ns}
      name={params.name}
      kindObj={kindObj}
    />
  );
};
export const AttachStorage = connectToPlural(AttachStorage_);

export type PVCDropdownProps = {
  namespace: string;
  selectedKey: string;
  required: boolean;
  onChange: (string) => void;
  id: string;
  name: string;
};

export type AttachStorageFormState = {
  resourceObj: K8sResourceKind;
  inProgress: boolean;
  claimName: string;
  volumeName: string;
  mountPath: string;
  subPath: string;
  mountAsReadOnly: boolean;
  error: string;
  allContainers: boolean;
  containers: any;
  volumeAlreadyMounted: boolean;
  showCreatePVC: string;
  newPVCObj: K8sResourceKind;
};

export type AttachStorageFormProps = {
  kindObj: K8sKind;
  namespace: string;
  name: string;
};
