import * as _ from 'lodash-es';
import * as React from 'react';

import { k8sPatch } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';

class TagsModal extends PromiseComponent {
  constructor (props) {
    super(props);

    // Track tags as an array instead of an object / Map so we can preserve the order during editing and so we can have
    // duplicate keys during editing. However, the ordering and any duplicate keys are lost when the form is submitted.
    this.state = Object.assign(this.state, {tags: _.isEmpty(props.tags) ? [['', '']] : _.toPairs(props.tags)});

    this._cancel = props.cancel.bind(this);
    this._change = this._change.bind(this);
    this._submit = this._submit.bind(this);
    this.appendTag = this.appendTag.bind(this);
    this.removeTag = this.removeTag.bind(this);
  }

  _change (e, i, isKey) {
    const {tags} = this.state;
    tags[i][isKey ? 0 : 1] = e.target.value;
    this.setState({tags});
  }

  _submit (e) {
    e.preventDefault();

    // We just throw away any rows where the key is blank
    const tags = _.reject(this.state.tags, t => _.isEmpty(t[0]));

    const keys = tags.map(t => t[0]);
    if (_.uniq(keys).length !== keys.length) {
      this.setState({errorMessage: 'Duplicate keys found.'});
      return;
    }

    // Convert any blank values to null
    _.each(tags, t => t[1] = _.isEmpty(t[1]) ? null : t[1]);

    const patch = [{path: this.props.path, op: 'replace', value: _.fromPairs(tags)}];
    const promise = k8sPatch(this.props.kind, this.props.resource, patch);
    this.handlePromise(promise).then(this.props.close);
  }

  appendTag () {
    this.setState({tags: this.state.tags.concat([['', '']])});
  }

  removeTag (i) {
    const {tags} = this.state;
    tags.splice(i, 1);
    this.setState({tags: tags.length ? tags : [['', '']]});
  }

  render () {
    const tagsElems = this.state.tags.map((tag, i) =>
      <div className="row tags-list__row" key={i}>
        <div className="col-xs-5 tags-list__field">
          <input type="text" className="form-control" placeholder="key" value={tag[0]} onChange={e => this._change(e, i, true)} />
        </div>
        <div className="col-xs-6 tags-list__field">
          <input type="text" className="form-control" placeholder="value" value={tag[1] || ''} onChange={e => this._change(e, i, false)} />
        </div>
        <div className="col-xs-1">
          <i className="fa fa-minus-circle tags-list__btn tags-list__delete-icon" onClick={() => this.removeTag(i)}></i>
        </div>
      </div>);

    return <form onSubmit={this._submit}>
      <ModalTitle>{this.props.title}</ModalTitle>
      <ModalBody>
        <div className="row">
          <div className="col-xs-5 tags-list__heading">Key</div>
          <div className="col-xs-6 tags-list__heading">Value</div>
        </div>
        {tagsElems}
        <div className="row">
          <div className="col-xs-12">
            <div className="btn-link tags-list__btn" onClick={this.appendTag}>
              <i className="fa fa-plus-circle tags-list__add-icon"></i>Add More
            </div>
          </div>
        </div>
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
