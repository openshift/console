import type { ChangeEvent, DetailedHTMLProps, HTMLAttributes } from 'react';
import { Component } from 'react';
import { Label as PfLabel } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';
import * as TagsInput from 'react-tagsinput';
import type { MatchExpression } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { selectorToString } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { split, selectorFromString } from '../../module/k8s/selector';
import * as k8sSelectorRequirement from '../../module/k8s/selector-requirement';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Custom element used as a styling hook for the tags input (see `_label.scss`)
      'tags-input': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

// Helpers for cleaning up tags by running them through the selector parser
const cleanSelectorStr = (tag: string) => selectorToString(selectorFromString(tag));
const cleanTags = (tags: string[]) => split(cleanSelectorStr(tags.join(',')));

export interface SelectorInputProps {
  autoFocus?: boolean;
  /** Additional props spread onto the underlying input element. */
  inputProps?: { [key: string]: unknown };
  labelClassName?: string;
  onChange: (tags: string[]) => void;
  onValidationChange?: (isValid: boolean) => void;
  options?: { basic?: boolean };
  placeholder?: string;
  tags: string[];
}

interface SelectorInputState {
  inputValue: string;
  isInputValid: boolean;
  tags: string[];
  // Last value of the tags prop mirrored into state, used to detect prop changes
  prevTags: string[];
}

interface RenderTagProps {
  tag: string;
  key: number;
  onRemove: (key: number) => void;
  getTagDisplayValue: (tag: string) => string;
}

export class SelectorInput extends Component<SelectorInputProps, SelectorInputState> {
  static arrayify(obj: { [key: string]: string | null }): string[] {
    return _.map(obj, (v, k) => (v ? `${k}=${v}` : k));
  }

  static objectify(arr: string[]): { [key: string]: string | null } {
    const result: { [key: string]: string | null } = {};
    _.each(arr, (item) => {
      const [key, value = null] = item.split('=');
      result[key] = value;
    });
    return result;
  }

  static arrayObjectsToArrayStrings(obj: MatchExpression[]): string[] {
    return _.map(
      obj,
      (v) => `${v.key} ${v.operator.toLowerCase()} (${(v.values ?? []).join(',')})`,
    );
  }

  static arrayToArrayOfObjects(arr: string[]): MatchExpression[] {
    const result: MatchExpression[] = [];
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

  private isBasic = !!_.get(this.props.options, 'basic');

  private inputRef: { focus: () => void };

  private setRef = (ref: { focus: () => void }) => {
    this.inputRef = ref;
  };

  constructor(props: SelectorInputProps) {
    super(props);
    this.state = {
      inputValue: '',
      isInputValid: true,
      tags: this.props.tags,
      prevTags: this.props.tags,
    };
  }

  static getDerivedStateFromProps(
    props: SelectorInputProps,
    state: SelectorInputState,
  ): Partial<SelectorInputState> | null {
    // Sync state.tags when the tags prop changes; local edits in between are kept.
    if (!_.isEqual(state.prevTags, props.tags)) {
      return { tags: props.tags, prevTags: props.tags };
    }
    return null;
  }

  notifyValidationChange = (isValid: boolean) => {
    if (this.props.onValidationChange) {
      this.props.onValidationChange(isValid);
    }
  };

  componentDidUpdate(_prevProps: SelectorInputProps, prevState: SelectorInputState) {
    // Call onValidationChange callback when isInputValid changes
    if (prevState.isInputValid !== this.state.isInputValid && this.props.onValidationChange) {
      this.notifyValidationChange(this.state.isInputValid);
    }
  }

  // eslint-disable-next-line react-js/no-unused-class-component-methods
  focus() {
    if (this.inputRef) {
      this.inputRef.focus();
    }
  }

  isTagValid(tag: string) {
    const requirement = k8sSelectorRequirement.requirementFromString(tag);
    return !!(requirement && (!this.isBasic || requirement.operator === 'Equals'));
  }

  handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // We track the input field value in state so we can retain the input value when an invalid tag is entered.
    // Otherwise, the default behaviour of TagsInput is to clear the input field.
    const inputValue = e.target.value;

    // If the user deletes an existing inputValue, set isInputValid back to true
    if (inputValue === '') {
      this.setState({ inputValue, isInputValid: true });
      return;
    }

    const isValid = this.isTagValid(inputValue);
    this.setState({ inputValue, isInputValid: isValid });
  };

  handleChange = (tags: string[], changed: string[]) => {
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
  };

  render() {
    const { inputValue, isInputValid, tags } = this.state;

    // Keys that add tags: Enter
    const addKeys = [13];

    // Backspace deletes tags, but not if there is text being edited in the input field
    const removeKeys = inputValue.length ? [] : [8];

    const inputProps = {
      autoFocus: this.props.autoFocus,
      className: css('input', { 'invalid-tag': !isInputValid }),
      onChange: this.handleInputChange,
      placeholder: _.isEmpty(tags) ? this.props.placeholder || 'app=frontend' : '',
      spellCheck: 'false',
      value: inputValue,
      id: 'tags-input',
      'data-test': 'tags-input',
      ...(this.props.inputProps || {}),
    };

    const renderTag = ({ tag, key, onRemove, getTagDisplayValue }: RenderTagProps): JSX.Element => (
      <PfLabel
        className={css('co-label tag-item-content', this.props.labelClassName)}
        key={key}
        onClose={() => onRemove(key)}
        data-test={`label=${key}`}
      >
        {getTagDisplayValue(tag)}
      </PfLabel>
    );

    return (
      <div className="pf-v6-c-form-control">
        <tags-input>
          <TagsInput
            ref={this.setRef}
            className="tags"
            value={tags}
            addKeys={addKeys}
            removeKeys={removeKeys}
            inputProps={inputProps}
            renderTag={renderTag}
            onChange={this.handleChange}
            addOnBlur
          />
        </tags-input>
      </div>
    );
  }
}
