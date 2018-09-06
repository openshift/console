import * as _ from 'lodash-es';
import * as React from 'react';

import { k8sPatch, referenceForModel } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, ResourceIcon, SelectorInput } from '../utils';

const LABELS_PATH = '/metadata/labels';
const TEMPLATE_SELECTOR_PATH = '/spec/template/metadata/labels';

class BaseLabelsModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = props.cancel.bind(this);
    const labels = SelectorInput.arrayify(_.get(props.resource, props.path.split('/').slice(1)));
    this.state = Object.assign(this.state, {
      labels,
    });
    this.createPath = !labels.length;
  }

  _submit (e) {
    e.preventDefault();

    const { kind, path, resource, isPodSelector } = this.props;

    const patch = [{
      op: this.createPath ? 'add' : 'replace',
      path,
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
    const { kind, resource, description, message, labelClassName } = this.props;

    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Edit {description || 'Labels'}</ModalTitle>
      <ModalBody>
        <div className="row co-m-form-row">
          <div className="col-sm-12">{message || 'Labels help you organize and select resources. Adding labels below will let you query for objects that have similar, overlapping or dissimilar labels.'}</div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label htmlFor="tags-input" className="control-label">
              {_.capitalize(description) || 'Labels'} for <ResourceIcon kind={kind.crd ? referenceForModel(kind) : kind.kind} /> {resource.metadata.name}
            </label>
            <SelectorInput onChange={labels => this.setState({labels})} tags={this.state.labels} labelClassName={labelClassName || `co-text-${kind.id}`} autoFocus />
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
  path={['replicationcontrolleres', 'services'].includes(props.kind.plural) ? '/spec/selector' : '/spec/selector/matchLabels'}
  isPodSelector={true}
  description="Pod Selector"
  message={`Determines the set of pods targeted by this ${props.kind.label.toLowerCase()}.`}
  labelClassName="co-text-pod"
  {...props}
/>);
