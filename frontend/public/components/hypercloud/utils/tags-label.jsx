import * as _ from 'lodash';
import * as React from 'react';
import { useState } from 'react';
import * as PropTypes from 'prop-types';
import * as classNames from 'classnames';
import TagsInput from 'react-tagsinput';
import { useFormContext, Controller } from 'react-hook-form';

export const TagsLabel = ({ name, placeholder = '' }) => {
  const { control, setValue, getValues, watch } = useFormContext();
  const [inputValue, setInputValue] = useState('');
  const [isInputValid, setIsInputValid] = useState(true);
  const [isEmpty, setIsEmpty] = useState(watch(name) === undefined);

  // An array of key codes that add a tag, default is [9, 13] (Tab and Enter).
  const addKeys = [13];
  // An array of key codes that remove a tag, default is [8] (Backspace).
  const removeKeys = inputValue.length ? [] : [8];

  const isTagValid = inputValue => {
    // 지금은 한글이 있는지만 validation
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(inputValue);
    return !hasKorean;
  };

  const handleInputChange = e => {
    const inputValue = e.target.value;

    // If the user deletes an existing inputValue, set isInputValid back to true
    if (inputValue === '') {
      setInputValue(inputValue);
      setIsInputValid(true);
      return;
    }
    setInputValue(inputValue);
    setIsInputValid(isTagValid(inputValue));
  };

  const handleChange = (tags, changed) => {
    const newTag = changed[0];

    if (!isTagValid(newTag)) {
      setIsInputValid(false);
      return;
    }
    setValue(name, tags);
    setIsEmpty(_.isEmpty(tags));
    setInputValue('');
    setIsInputValid(true);
  };

  const renderTag = ({ tag, key, onRemove, getTagDisplayValue }) => {
    return (
      <span className={classNames('tag-item', 'co-m-label', 'co-text-pod')} key={key}>
        <span className="tag-item__content">{getTagDisplayValue(tag)}</span>
        &nbsp;
        <a className="remove-button" onClick={() => onRemove(key)}>
          ×
        </a>
      </span>
    );
  };

  const inputProps = {
    className: classNames('input', { 'invalid-tag': !isInputValid }),
    spellCheck: 'false',
    value: inputValue,
    placeholder: isEmpty ? placeholder : '',
    id: 'tags-input',
    onChange: handleInputChange,
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ value }) => (
        <div className="co-search-input pf-c-form-control">
          <tags-input>
            <TagsInput onChange={handleChange} value={value ? value : []} className="tags" renderTag={renderTag} inputProps={inputProps} addKeys={addKeys} removeKeys={removeKeys} addOnBlur></TagsInput>
          </tags-input>
        </div>
      )}
    ></Controller>
  );
};

TagsLabel.propTypes = {
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
};
