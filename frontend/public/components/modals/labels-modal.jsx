import React from 'react';

import { k8sPatch } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, ResourceIcon, SelectorInput } from '../utils';

const LABELS_PATH = '/metadata/labels';
const SELECTOR_PATH = '/spec/selector/matchLabels';
const TEMPLATE_SELECTOR_PATH = '/spec/template/metadata/labels';

class LabelsModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = props.cancel.bind(this);
    this.path = props.labelSelector ? SELECTOR_PATH : LABELS_PATH;
    this.state = {
      labels: SelectorInput.arrayify(_.get(props.resource, this.path.split('/').slice(1))),
    };
  }

  _submit (e) {
    e.preventDefault();

    const { kind, resource, labelSelector } = this.props;

    const patch = [{
      path: this.path,
      op: 'replace',
      value: SelectorInput.objectify(this.state.labels),
    }];

    // https://kubernetes.io/docs/user-guide/deployments/#selector
    //   .spec.selector must match .spec.template.metadata.labels, or it will be rejected by the API
    const updateTemplate = labelSelector
      && !_.isEmpty(_.get(resource, TEMPLATE_SELECTOR_PATH.split('/').slice(1)));

    if (updateTemplate) {
      patch.push({
        path: TEMPLATE_SELECTOR_PATH,
        op: 'replace',
        value: SelectorInput.objectify(this.state.labels),
      });
    }
    const promise = k8sPatch(kind, resource, patch);
    this._setRequestPromise(promise).then(this.props.close);
  }

  render() {
    const { kind, resource, labelSelector } = this.props;

    return <form onSubmit={this._submit} name="form">
      <ModalTitle>
        { labelSelector
          ? `Modify ${kind.label} Label Selector`
          : `Modify ${kind.label} Labels`
        }
      </ModalTitle>
      <ModalBody>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            { labelSelector
              ? `${kind.labelPlural} ensure the configured number of pods matching this pod selector are healthy and running.`
              : 'Labels are key/value pairs used to scope and select resources.'
            }
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label className="control-label">
              { labelSelector
                ? 'Label Selector '
                : 'Labels '
              }
              for <ResourceIcon kind={kind.id} /> {resource.metadata.name}
            </label>
            <SelectorInput onChange={labels => this.setState({labels})} tags={this.state.labels} autoFocus/>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter promise={this.requestPromise} submitText={labelSelector ? 'Save Label Selector' : 'Save Labels'} cancel={this._cancel} />
    </form>;
  }
}

export const labelsModal = createModalLauncher(LabelsModal);
