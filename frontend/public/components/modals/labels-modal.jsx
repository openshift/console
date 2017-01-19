import React from 'react';

import { k8sPatch } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, ResourceIcon, SelectorInput } from '../utils';

export const labelsModal = createModalLauncher(
class LabelsModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = props.cancel.bind(this);
    this.state = {
      labels: SelectorInput.arrayify(props.resource.metadata.labels),
    };
  }

  _submit (e) {
    e.preventDefault();

    const { kind, resource } = this.props;
    const promise = k8sPatch(kind, resource, [{
      op: 'replace',
      path: '/metadata/labels',
      value: SelectorInput.objectify(this.state.labels),
    }]);
    this._setRequestPromise(promise).then(this.props.close);
  }

  render() {
    const { kind, resource } = this.props;
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Modify {kind.label} Labels</ModalTitle>
      <ModalBody>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            Labels are key/value pairs used to scope and select resources.
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label className="control-label">
              Labels for <ResourceIcon kind={kind.id} /> {resource.metadata.name}
            </label>
            <SelectorInput onChange={labels => this.setState({labels})} tags={this.state.labels} />
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter promise={this.requestPromise} errorFormatter="k8sApi" submitText="Save Labels" cancel={this._cancel} />
    </form>;
  }
});
