import * as _ from 'lodash-es';
import * as React from 'react';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, history, resourceListPathFromModel } from '../utils';
import { k8sKill } from '../../module/k8s/';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { Translation } from 'react-i18next';
//Modal for resource deletion and allows cascading deletes if propagationPolicy is provided for the enum
class DeleteModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
    this.state = Object.assign(this.state, {
      isChecked: true,
    });
  }

  _submit(event) {
    event.preventDefault();
    const { kind, resource } = this.props;

    //https://kubernetes.io/docs/concepts/workloads/controllers/garbage-collection/
    const propagationPolicy = this.state.isChecked ? kind.propagationPolicy : 'Orphan';
    const json = propagationPolicy
      ? { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }
      : null;

    this.handlePromise(k8sKill(kind, resource, {}, json)).then(() => {
      this.props.close();

      // If we are currently on the deleted resource's page, redirect to the resource list page
      const re = new RegExp(`/${resource.metadata.name}(/|$)`);
      if (re.test(window.location.pathname)) {
        const listPath = this.props.redirectTo
          ? this.props.redirectTo
          : resourceListPathFromModel(kind, _.get(resource, 'metadata.namespace'));
        history.push(listPath);
      }
    });
  }

  _onChecked() {
    this.checked = !this.checked;
  }

  render() {
    const { kind, resource, message } = this.props;
    return (
      <Translation>
        {
          (t) =>
            <form onSubmit={this._submit} name="form" className="modal-content ">
              <ModalTitle>
                <YellowExclamationTriangleIcon className="co-icon-space-r" /> Delete {kind.label}?
      </ModalTitle>
              <ModalBody className="modal-body">
                {message}
                <div>
                  Are you sure you want to delete{' '}
                  <strong className="co-break-word">{resource.metadata.name}</strong>
                  {_.has(resource.metadata, 'namespace') && (
                    <span>
                      {' '}
              in namespace <strong>{resource.metadata.namespace}</strong>
                    </span>
                  )}
          ?
          {_.has(kind, 'propagationPolicy') && (
                    <div className="checkbox">
                      <label className="control-label">
                        <input
                          type="checkbox"
                          onChange={() => this.setState({ isChecked: !this.state.isChecked })}
                          checked={!!this.state.isChecked}
                        />
                Delete dependent objects of this resource
              </label>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalSubmitFooter
                errorMessage={this.state.errorMessage}
                inProgress={this.state.inProgress}
                submitDanger
                submitText={this.props.btnText || `${t('DELETE')}`}
                cancel={this._cancel}
              />
            </form>
        }
      </Translation>
    );
  }
}

export const deleteModal = createModalLauncher(DeleteModal);
