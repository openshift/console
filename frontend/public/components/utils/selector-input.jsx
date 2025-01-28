import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as TagsInput from 'react-tagsinput';
import { Label as PfLabel } from '@patternfly/react-core';

import { split, selectorFromString } from '../../module/k8s/selector';
import * as k8sSelectorRequirement from '../../module/k8s/selector-requirement';
import { selectorToString } from '@console/dynamic-plugin-sdk/src/utils/k8s';

// Helpers for cleaning up tags by running them through the selector parser
const cleanSelectorStr = (tag) => selectorToString(selectorFromString(tag));
const cleanTags = (tags) => split(cleanSelectorStr(tags.join(',')));

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

  componentDidUpdate(prevProps) {
    if (!_.isEqual(prevProps.tags, this.props.tags)) {
      this.setState({ tags: this.props.tags });
    }
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

  static arrayObjectsToArrayStrings(obj) {
    return _.map(obj, (v) => `${v.key} ${v.operator.toLowerCase()} (${v.values.join(',')})`);
  }

  static arrayToArrayOfObjects(arr) {
    const result = [];
    for (const item of arr) {
      if (item.includes('(')) {
        const [key, operator, values] = item.split(' ');
        result.push({
          key,
          operator: _.capitalize(operator),
          // eslint-disable-next-line no-useless-escape
          values: values.replace(/[\(\)]/g, '').split(','),
        });
      }
    }
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

    // If the user deletes an existing inputValue, set isInputValid back to true
    if (inputValue === '') {
      this.setState({ inputValue, isInputValid: true });
      return;
    }

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
      placeholder: _.isEmpty(tags) ? this.props.placeholder || 'app=frontend' : '',
      spellCheck: 'false',
      value: inputValue,
      id: 'tags-input',
      ['data-test']: 'tags-input',
      ...(this.props.inputProps || {}),
    };

    const renderTag = ({ tag, key, onRemove, getTagDisplayValue }) => {
      return (
        <PfLabel
          className={classNames('co-label tag-item-content', this.props.labelClassName)}
          key={key}
          onClose={() => onRemove(key)}
          isTruncated
          data-test={`label=${key}`}
        >
          {getTagDisplayValue(tag)}
        </PfLabel>
      );
    };

    return (
      <div className="pf-v5-c-form-control">
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
            addOnBlur
          />
        </tags-input>
      </div>
    );
  }
}
