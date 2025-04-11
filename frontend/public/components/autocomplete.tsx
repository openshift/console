/* eslint-disable @typescript-eslint/no-use-before-define */
import * as React from 'react';
import classNames from 'classnames';
import { useDocumentListener, getLabelsAsString } from '@console/shared';
import { KeyEventModes } from '@console/shared/src/hooks';
import { fuzzyCaseInsensitive } from './factory/table-filters';
import { TextFilter } from './factory';

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

const AutocompleteInput: React.FC<AutocompleteInputProps> = (props) => {
  const [suggestions, setSuggestions] = React.useState<string[]>();
  const { visible, setVisible, ref } = useDocumentListener<HTMLDivElement>(suggestionBoxKeyHandler);
  const {
    textValue,
    setTextValue,
    onSuggestionSelect,
    placeholder,
    showSuggestions,
    data,
    className,
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

  const handleInput = (event: React.FormEvent<HTMLInputElement>, input: string) => {
    if (input) {
      setVisible(true);
    } else {
      setVisible(false);
    }
    setTextValue(input);
  };

  React.useEffect(() => {
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
        <div
          className={classNames('co-suggestion-box__suggestions', {
            'co-suggestion-box__suggestions--shadowed': visible && suggestions?.length > 0,
          })}
        >
          {visible &&
            suggestions?.map((elem) => (
              <SuggestionLine
                suggestion={elem}
                key={elem}
                onClick={onSelect}
                className={className}
              />
            ))}
        </div>
      )}
    </div>
  );
};

type AutocompleteInputProps = {
  onSuggestionSelect: (selected: string) => void;
  placeholder?: string;
  suggestionCount?: number;
  showSuggestions?: boolean;
  textValue: string;
  setTextValue: React.Dispatch<React.SetStateAction<String>>;
  className?: string;
  data?: any;
  labelPath?: string;
};

const SuggestionLine: React.FC<SuggestionLineProps> = ({ suggestion, onClick, className }) => {
  return (
    <button className="co-suggestion-line" onClick={() => onClick(suggestion)}>
      <span className={className}>{suggestion}</span>
    </button>
  );
};

type SuggestionLineProps = {
  suggestion: string;
  onClick: (param: string) => void;
  className?: string;
};

export default AutocompleteInput;
