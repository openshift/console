import * as _ from 'lodash-es';
import * as React from 'react';

import { ClusterVersionModel } from '../../models';
import { Dropdown, PromiseComponent } from '../utils';
import {
  ClusterVersionKind,
  getAvailableClusterUpdates,
  getDesiredClusterVersion,
  getSortedUpdates,
  k8sPatch,
} from '../../module/k8s';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory/modal';

class ClusterUpdateModal extends PromiseComponent<
  ClusterUpdateModalProps,
  ClusterUpdateModalState
> {
  readonly state: ClusterUpdateModalState;

  constructor(public props: ClusterUpdateModalProps) {
    super(props);
    const available = getSortedUpdates(props.cv);
    this.state.selectedVersion = _.get(available, '[0].version', '');
  }

  _submit = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    const { selectedVersion } = this.state;
    if (!selectedVersion) {
      return;
    }
    const { cv } = this.props;
    const available = getAvailableClusterUpdates(cv);
    const desired = _.find(available, { version: selectedVersion });
    if (!desired) {
      this.setState({
        errorMessage: `Version ${selectedVersion} not found among the available updates. Select another version.`,
      });
      return;
    }

    // Clear any previous error message.
    this.setState({ errorMessage: '' });
    const patch = [{ op: 'add', path: '/spec/desiredUpdate', value: desired }];
    this.handlePromise(k8sPatch(ClusterVersionModel, cv, patch)).then(this.props.close);
  };

  _cancel = () => {
    this.props.close();
  };

  _change = (selectedVersion: string) => {
    this.setState({ selectedVersion });
  };

  render() {
    const { cv } = this.props;
    const { selectedVersion } = this.state;
    const availableUpdates = getSortedUpdates(cv);
    const currentVersion = getDesiredClusterVersion(cv);
    const dropdownItems = _.reduce(
      availableUpdates,
      (acc, { version }) => {
        acc[version] = version;
        return acc;
      },
      {},
    );
    return (
      <form
        onSubmit={this._submit}
        name="form"
        className="modal-content modal-content--no-inner-scroll"
      >
        <ModalTitle>Update Cluster</ModalTitle>
        <ModalBody>
          {/* <p>
          // TODO: Determine what content goes here.
        </p> */}
          <div className="form-group">
            <label>Current Version</label>
            <p>{currentVersion}</p>
          </div>
          <div className="form-group">
            <label htmlFor="version_dropdown">Select New Version</label>
            <Dropdown
              className="cluster-update-modal__dropdown"
              id="version_dropdown"
              items={dropdownItems}
              onChange={this._change}
              selectedKey={selectedVersion}
              title="Select Version"
            />
          </div>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText="Update"
          cancel={this._cancel}
        />
      </form>
    );
  }
}

export const clusterUpdateModal = createModalLauncher(ClusterUpdateModal);

type ClusterUpdateModalProps = {
  cv: ClusterVersionKind;
} & ModalComponentProps;

type ClusterUpdateModalState = {
  selectedVersion: string;
  inProgress: boolean;
  errorMessage: string;
};
