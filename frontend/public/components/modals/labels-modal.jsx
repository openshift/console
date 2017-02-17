import React from 'react';

import { k8sPatch } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, ResourceIcon, SelectorInput } from '../utils';

const LABELS_PATH = '/metadata/labels';
const SELECTOR_PATH = '/spec/selector/matchLabels';
const TEMPLATE_SELECTOR_PATH = '/spec/template/metadata/labels';
const NODE_SELECTOR_PATH = '/spec/template/spec/nodeSelector';

class BaseLabelsModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = props.cancel.bind(this);
    this.state = Object.assign(this.state, {
      labels: SelectorInput.arrayify(_.get(props.resource, props.path.split('/').slice(1))),
    });
  }

  _submit (e) {
    e.preventDefault();

    const { kind, path, resource, isPodSelector } = this.props;

    const patch = [{
      path,
      op: 'replace',
      value: SelectorInput.objectify(this.state.labels),
    }];

    // https://kubernetes.io/docs/user-guide/deployments/#selector
    //   .spec.selector must match .spec.template.metadata.labels, or it will be rejected by the API
    const updateTemplate = isPodSelector
      && !_.isEmpty(_.get(resource, TEMPLATE_SELECTOR_PATH.split('/').slice(1)));

    if (updateTemplate) {
      patch.push({
        path: TEMPLATE_SELECTOR_PATH,
        op: 'replace',
        value: SelectorInput.objectify(this.state.labels),
      });
    }
    const promise = k8sPatch(kind, resource, patch);
    this.handlePromise(promise).then(this.props.close);
  }

  render() {
    const { kind, resource, description, message } = this.props;

    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Modify {description || `${kind.label} Labels`}</ModalTitle>
      <ModalBody>
        <div className="row co-m-form-row">
          <div className="col-sm-12">{message || 'Labels are key/value pairs used to scope and select resources.'}</div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label className="control-label">
              {_.capitalize(description) || 'Labels'} for <ResourceIcon kind={kind.id} /> {resource.metadata.name}
            </label>
            <SelectorInput onChange={labels => this.setState({labels})} tags={this.state.labels} autoFocus/>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText={`Save ${description || 'Labels'}`} cancel={this._cancel} />
    </form>;
  }
}

export const labelsModal = createModalLauncher((props) => <BaseLabelsModal
  path={LABELS_PATH}
  {...props}
/>);

export const podSelectorModal = createModalLauncher((props) => <BaseLabelsModal
  path={SELECTOR_PATH}
  isPodSelector={true}
  description="Pod Selector"
  message={`Determines the set of pods targeted by this ${props.kind.label.toLowerCase()}.`}
  {...props}
/>);

export const nodeSelectorModal = createModalLauncher((props) => <BaseLabelsModal
  path={NODE_SELECTOR_PATH}
  description="Node Selector"
  message="Node selectors allow you to constrain pods to only run on nodes with matching labels."
  {...props}
/>);
