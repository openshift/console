import * as _ from 'lodash-es';
import * as React from 'react';

import { k8sPatch } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';
import { NameValueEditor, NAME, VALUE } from '../utils/name-value-editor';

class TagsModal extends PromiseComponent {
  constructor (props) {
    super(props);

    // Track tags as an array instead of an object / Map so we can preserve the order during editing and so we can have
    // duplicate keys during editing. However, the ordering and any duplicate keys are lost when the form is submitted.
    this.state = Object.assign(this.state, {tags: _.isEmpty(props.tags) ? [['', '']] : _.toPairs(props.tags)});

    this._cancel = props.cancel.bind(this);
    this._updateTags = this._updateTags.bind(this);
    this._submit = this._submit.bind(this);

  };

  _updateTags(tags) {
    this.setState({
      tags: tags.nameValuePairs
    });
  }

  _submit(e) {
    e.preventDefault();

    // We just throw away any rows where the key is blank
    const tags = _.reject(this.state.tags, t => _.isEmpty(t[NAME]));

    const keys = tags.map(t => t[NAME]);
    if (_.uniq(keys).length !== keys.length) {
      this.setState({errorMessage: 'Duplicate keys found.'});
      return;
    }

    // Convert any blank values to null
    _.each(tags, t => t[VALUE] = _.isEmpty(t[VALUE]) ? null : t[VALUE]);
    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = this.props.tags ? 'replace' : 'add';
    const patch = [{path: this.props.path, op, value: _.fromPairs(tags)}];
    const promise = k8sPatch(this.props.kind, this.props.resource, patch);
    this.handlePromise(promise).then(this.props.close);
  }

  render() {
    const {tags} = this.state;

    return <form onSubmit={this._submit}>
      <ModalTitle>{this.props.title}</ModalTitle>
      <ModalBody>
        <NameValueEditor nameValuePairs={tags} submit={this._submit} updateParentData={this._updateTags}/>
      </ModalBody>
      <ModalSubmitFooter submitText="Save Changes" cancel={this._cancel} errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} />
    </form>;
  }
}

export const annotationsModal = createModalLauncher(props => <TagsModal
  path="/metadata/annotations"
  tags={props.resource.metadata.annotations}
  title="Annotations"
  {...props}
/>);
