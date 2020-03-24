import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';
import { useHideComponent } from '@console/shared';
import { fuzzyCaseInsensitive } from './factory/table-filters';

const MAX_SUGGESTIONS = 5;

const labelParser = (nodes) => {
  const labels = _.map(nodes, (x) => x.metadata.labels);
  const stringify = (labelObj) =>
    JSON.stringify(labelObj)
      .replace(/[{}"]/g, '')
      .split(',');
  const flatLabels = _.flatten(_.map(labels, stringify));
  const set = new Set(flatLabels);
  return Array.from(set);
};

const AutoCompleteInput: React.FC<AutoCompleteInputProps> = (props) => {
  // Raw data from BE. Apply user filter to it
  const [suggestions, setSuggestions] = React.useState<string[]>();
  const [loading, setLoading] = React.useState(true);
  const { visible, setVisible, ref } = useHideComponent();
  const { textValue, setTextValue, onSuggestionSelect, placeholder, showSuggestions, data } = props;

  const onSelect = (value: string) => {
    onSuggestionSelect(value);
    if (visible) {
      setVisible(false);
    }
  };

  const activate = () => {
    if (!visible && !_.isEmpty(textValue.trim())) {
      setVisible(true);
    }
  };

  const handleInput = (input: string) => {
    if (!_.isEmpty(input)) {
      setVisible(true);
    } else {
      setVisible(false);
    }
    setTextValue(input);
  };

  React.useEffect(() => {
    if (textValue !== '' && visible && showSuggestions) {
      // (Todo: bipuladh) Add debounce to make this loading state more effective.
      setLoading(true);
      const processed = labelParser(data);
      const filtered = processed
        .filter((item) => fuzzyCaseInsensitive(textValue, item))
        .slice(0, MAX_SUGGESTIONS - 1);
      setSuggestions(filtered);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, textValue]);

  return (
    <div className="co-suggestion-box">
      <input
        value={textValue}
        className="co-suggestion-box__input"
        onChange={(e) => handleInput(e.target.value)}
        placeholder={placeholder}
        onFocus={activate}
      />
      {showSuggestions && (
        <div className="co-suggestion-box__suggestions" ref={ref}>
          {loading && visible ? (
            <>
              <div className="co-suggestion-line">
                <span className="skeleton-suggestion"></span>
              </div>
              <div className="co-suggestion-line">
                <span className="skeleton-suggestion"></span>
              </div>
              <div className="co-suggestion-line">
                <span className="skeleton-suggestion"></span>
              </div>
              <div className="co-suggestion-line">
                <span className="skeleton-suggestion"></span>
              </div>
              <div className="co-suggestion-line">
                <span className="skeleton-suggestion"></span>
              </div>
              <div className="co-suggestion-line">
                <span className="skeleton-suggestion"></span>
              </div>
            </>
          ) : (
            visible &&
            suggestions &&
            suggestions.map((elem, index) => (
              <SuggestionLine
                className={props.className}
                suggestion={elem}
                key={`${elem}-${index}`}
                onClick={onSelect}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

type AutoCompleteInputProps = {
  onSuggestionSelect: (selected: string) => void;
  placeholder?: string;
  suggestionCount?: number;
  showSuggestions?: boolean;
  textValue: string;
  setTextValue: React.Dispatch<React.SetStateAction<String>>;
  className?: string;
  data?: any;
};

const SuggestionLine: React.FC<SuggestionLineProps> = ({ suggestion, onClick, className }) => {
  return (
    <div className="co-suggestion-line" onClick={() => onClick(suggestion)}>
      <span className={classNames('co-suggestion-line__text', className)}>{suggestion}</span>
    </div>
  );
};

type SuggestionLineProps = {
  suggestion: string;
  onClick: (param: string) => void;
  className?: string;
};

export default AutoCompleteInput;
