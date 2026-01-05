import type { ComponentProps, FC, SetStateAction, Dispatch, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { css } from '@patternfly/react-styles';
import { useDocumentListener, KeyEventModes } from '@console/shared/src/hooks/document-listener';
import { getLabelsAsString } from '@console/shared/src/utils/label-filter';

import { fuzzyCaseInsensitive } from './factory/table-filters';
import { TextFilter } from './factory/text-filter';
import { Label, SelectList } from '@patternfly/react-core';

const MAX_SUGGESTIONS = 5;

const labelParser = (resources: any[], labelPath: string): Set<string> => {
  return resources.reduce((acc: Set<string>, resource: any) => {
    getLabelsAsString(resource, labelPath).forEach((label) => acc.add(label));
    return acc;
  }, new Set<string>());
};

const suggestionBoxKeyHandler = {
  Escape: KeyEventModes.HIDE,
};

type SuggestionLineProps = {
  suggestion: string;
  onClick: (param: string) => void;
  color: ComponentProps<typeof Label>['color'];
};

const SuggestionLine: FC<SuggestionLineProps> = ({ suggestion, onClick, color }) => {
  return (
    <div>
      <Label
        variant="outline"
        onClick={() => onClick(suggestion)}
        data-test="suggestion-line"
        color={color}
      >
        {suggestion}
      </Label>
    </div>
  );
};

type AutocompleteInputProps = {
  onSuggestionSelect: (selected: string) => void;
  placeholder?: string;
  suggestionCount?: number;
  showSuggestions?: boolean;
  textValue: string;
  setTextValue: Dispatch<SetStateAction<String>>;
  color?: SuggestionLineProps['color'];
  data?: any;
  labelPath?: string;
};

const AutocompleteInput: FC<AutocompleteInputProps> = (props) => {
  const [suggestions, setSuggestions] = useState<string[]>();
  const { visible, setVisible, ref } = useDocumentListener<HTMLDivElement>(suggestionBoxKeyHandler);
  const {
    textValue,
    setTextValue,
    onSuggestionSelect,
    placeholder,
    showSuggestions,
    data,
    color,
    labelPath,
  } = props;

  const onSelect = (value: string) => {
    onSuggestionSelect(value);
    if (visible) {
      setVisible(false);
    }
  };

  const activate = () => {
    if (textValue.trim()) {
      setVisible(true);
    }
  };

  const handleInput = (event: FormEvent<HTMLInputElement>, input: string) => {
    if (input) {
      setVisible(true);
    } else {
      setVisible(false);
    }
    setTextValue(input);
  };

  useEffect(() => {
    if (textValue && visible && showSuggestions) {
      const processed = labelParser(data, labelPath);
      // User input without whitespace
      const processedText = textValue.trim().replace(/\s*=\s*/, '=');
      const filtered = [...processed]
        .filter((item) => fuzzyCaseInsensitive(processedText, item))
        .slice(0, MAX_SUGGESTIONS);
      setSuggestions(filtered);
    }
  }, [visible, textValue, showSuggestions, data, labelPath]);

  return (
    <div className="co-suggestion-box" ref={ref}>
      <TextFilter
        value={textValue}
        onChange={handleInput}
        placeholder={placeholder}
        onFocus={activate}
      />
      {showSuggestions && (
        <SelectList
          className={css('co-suggestion-box__suggestions', {
            'co-suggestion-box__suggestions--shadowed': visible && suggestions?.length > 0,
          })}
        >
          {visible &&
            suggestions?.map((elem) => (
              <SuggestionLine suggestion={elem} key={elem} onClick={onSelect} color={color} />
            ))}
        </SelectList>
      )}
    </div>
  );
};

export default AutocompleteInput;
