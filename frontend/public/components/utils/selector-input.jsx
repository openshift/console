import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as TagsInput from 'react-tagsinput';

import * as k8sSelector from '../../module/k8s/selector';
import * as k8sSelectorRequirement from '../../module/k8s/selector-requirement';

// Helpers for cleaning up tags by running them through the selector parser
const cleanSelectorStr = (tag) => k8sSelector.selectorToString(k8sSelector.selectorFromString(tag));
const cleanTags = (tags) => k8sSelector.split(cleanSelectorStr(tags.join(',')));

export class SelectorInput extends React.Component {
  constructor(props) {
    super(props);
    this.isBasic = !!_.get(this.props.options, 'basic');
    this.setRef = (ref) => (this.ref_ = ref);
    this.state = {
      inputValue: '',
      isInputValid: true,
      tags: this.props.tags,
    };
  }

  static arrayify(obj) {
    return _.map(obj, (v, k) => (v ? `${k}=${v}` : k));
  }

  static objectify(arr) {
    const result = {};
    _.each(arr, (item) => {
      const [key, value = null] = item.split('=');
      result[key] = value;
    });
    return result;
  }

  focus() {
    this.ref_ && this.ref_.focus();
  }

  isTagValid(tag) {
    const requirement = k8sSelectorRequirement.requirementFromString(tag);
    return !!(requirement && (!this.isBasic || requirement.operator === 'Equals'));
  }

  handleInputChange(e) {
    // We track the input field value in state so we can retain the input value when an invalid tag is entered.
    // Otherwise, the default behaviour of TagsInput is to clear the input field.
    const inputValue = e.target.value;
    this.setState({ inputValue, isInputValid: this.isTagValid(inputValue) });
  }

  handleChange(tags, changed) {
    // The way we use TagsInput, there should only ever be one new tag in changed
    const newTag = changed[0];

    if (!this.isTagValid(newTag)) {
      this.setState({ isInputValid: false });
      return;
    }

    // Clean up the new tag by running it through the selector parser
    const cleanNewTag = cleanSelectorStr(newTag);

    // Is the new tag a duplicate of an already existing tag?
    // Note that TagsInput accepts an onlyUnique property, but we handle this logic ourselves so that we can set a
    // custom error class
    if (_.filter(tags, (tag) => tag === cleanNewTag).length > 1) {
      this.setState({ isInputValid: false });
      return;
    }

    const newTags = cleanTags(tags);
    this.setState({ inputValue: '', isInputValid: true, tags: newTags });
    this.props.onChange(newTags);
  }

  render() {
    const { inputValue, isInputValid, tags } = this.state;

    // Keys that add tags: Enter
    const addKeys = [13];

    // Backspace deletes tags, but not if there is text being edited in the input field
    const removeKeys = inputValue.length ? [] : [8];

    const inputProps = {
      autoFocus: this.props.autoFocus,
      className: classNames('input', { 'invalid-tag': !isInputValid }),
      onChange: this.handleInputChange.bind(this),
      placeholder: _.isEmpty(tags) ? 'app=frontend' : '',
      spellCheck: 'false',
      value: inputValue,
      id: 'tags-input',
      ...(this.props.inputProps || {}),
    };

    const renderTag = ({ tag, key, onRemove, getTagDisplayValue }) => {
      return (
        <span className={classNames('tag-item', this.props.labelClassName)} key={key}>
          <span className="tag-item__content">{getTagDisplayValue(tag)}</span>
          &nbsp;
          <a className="remove-button" onClick={() => onRemove(key)}>
            ×
          </a>
        </span>
      );
    };

    return (
      <div className="co-search-input pf-c-form-control">
        <tags-input>
          <TagsInput
            ref={this.setRef}
            className="tags"
            value={tags}
            addKeys={addKeys}
            removeKeys={removeKeys}
            inputProps={inputProps}
            renderTag={renderTag}
            onChange={this.handleChange.bind(this)}
            addOnPaste
            addOnBlur
          />
        </tags-input>
      </div>
    );
  }
}
