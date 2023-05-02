import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';
import { queryBrowserPatchQuery, queryBrowserRunQueries } from '@console/internal/actions/observe';
import { RootState } from '@console/internal/redux';
import CloseButton from '@console/shared/src/components/close-button';

type QueryInputProps = {
  index: number;
  namespace?: string;
};

const operators = [
  'and',
  'by()',
  'group_left()',
  'group_right()',
  'ignoring()',
  'offset',
  'on()',
  'or',
  'unless',
  'without()',
];

const aggregationOperators = [
  'avg()',
  'bottomk()',
  'count()',
  'count_values()',
  'max()',
  'min()',
  'quantile()',
  'stddev()',
  'stdvar()',
  'sum()',
  'topk()',
];

const prometheusFunctions = [
  'abs()',
  'absent()',
  'avg_over_time()',
  'ceil()',
  'changes()',
  'clamp_max()',
  'clamp_min()',
  'count_over_time()',
  'day_of_month()',
  'day_of_week()',
  'days_in_month()',
  'delta()',
  'deriv()',
  'exp()',
  'floor()',
  'histogram_quantile()',
  'holt_winters()',
  'hour()',
  'idelta()',
  'increase()',
  'irate()',
  'label_join()',
  'label_replace()',
  'ln()',
  'log10()',
  'log2()',
  'max_over_time()',
  'min_over_time()',
  'minute()',
  'month()',
  'predict_linear()',
  'quantile_over_time()',
  'rate()',
  'resets()',
  'round()',
  'scalar()',
  'sort()',
  'sort_desc()',
  'sqrt()',
  'stddev_over_time()',
  'stdvar_over_time()',
  'sum_over_time()',
  'time()',
  'timestamp()',
  'vector()',
  'year()',
];

export const fuzzyCaseInsensitive = (a: string, b: string): boolean =>
  fuzzy(_.toLower(a), _.toLower(b));

// Highlight characters in `text` based on the search string `token`
const HighlightMatches: React.FC<{ text: string; token: string }> = ({ text, token }) => {
  // Autocompletion uses fuzzy matching, so the entire `token` string may not be a substring of
  // `text`. Instead, we find the longest starting substring of `token` that exists in `text` and
  // highlight it. Then we repeat with the remainder of `token` and `text` and continue until all
  // the characters of `token` have been found somewhere in `text`.
  for (let sub = token; sub.length > 0; sub = sub.slice(0, -1)) {
    const i = text.toLowerCase().indexOf(sub);
    if (i !== -1) {
      return (
        <>
          {text.slice(0, i)}
          <span className="query-browser__autocomplete-match">{text.slice(i, i + sub.length)}</span>
          <HighlightMatches text={text.slice(i + sub.length)} token={token.slice(sub.length)} />
        </>
      );
    }
  }
  return <>{text}</>;
};

export const QueryInput: React.FC<QueryInputProps> = ({ index }) => {
  const { t } = useTranslation();

  const [token, setToken] = React.useState('');

  const metrics = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'metrics']),
  );

  const text = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'text'], ''),
  );

  const dispatch = useDispatch();

  const inputRef = React.useRef(null);

  const getTextBeforeCursor = () =>
    inputRef.current.value.substring(0, inputRef.current.selectionEnd);

  const updateToken = _.debounce(() => {
    // Metric and function names can only contain the characters a-z, A-Z, 0-9, '_' and ':'
    const allTokens = getTextBeforeCursor().split(/[^a-zA-Z0-9_:]+/);

    // We always do case insensitive autocompletion, so convert to lower case immediately
    setToken(_.toLower(_.last(allTokens)));
  }, 200);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(queryBrowserPatchQuery(index, { text: e.target.value }));
    updateToken();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Enter+Shift inserts newlines, Enter alone runs the query
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      dispatch(queryBrowserRunQueries());
      setToken('');
    }
  };

  const onBlur = () => {
    setToken('');
  };

  // Use onMouseDown instead of onClick so that this is run before the onBlur handler
  const onMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Replace the autocomplete token with the selected autocomplete option (case insensitive)
    const re = new RegExp(`${_.escapeRegExp(token)}$`, 'i');
    const newTextBeforeCursor = getTextBeforeCursor().replace(
      re,
      e.currentTarget.dataset.autocomplete,
    );
    dispatch(
      queryBrowserPatchQuery(index, {
        text: newTextBeforeCursor + text.substring(inputRef.current.selectionEnd),
      }),
    );

    // Move cursor to just after the text we inserted (use _.defer() so this is called after the textarea value is set)
    const cursorPosition = newTextBeforeCursor.length;
    _.defer(() => {
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      inputRef.current.focus();
    });
  };

  const onClear = () => {
    dispatch(queryBrowserPatchQuery(index, { text: '' }));
    inputRef.current.focus();
  };

  // Order autocompletion suggestions so that exact matches (token as a substring) are first, then fuzzy matches after
  // Exact matches are sorted first by how early the token appears and secondarily by string length (shortest first)
  // Fuzzy matches are sorted by string length (shortest first)
  const isMatch = (v: string) => fuzzyCaseInsensitive(token, v);
  const matchScore = (v: string): number => {
    const i = v.toLowerCase().indexOf(token);
    return i === -1 ? Infinity : i;
  };
  const filterSuggestions = (options: string[]): string[] =>
    _.sortBy(options.filter(isMatch), [matchScore, 'length']);

  const allSuggestions =
    token.length < 2
      ? {}
      : _.omitBy(
          {
            Operators: filterSuggestions(operators),
            'Aggregation Operators': filterSuggestions(aggregationOperators),
            Functions: filterSuggestions(prometheusFunctions),
            Metrics: filterSuggestions(metrics),
          },
          _.isEmpty,
        );

  // Set the default textarea height to the number of lines in the query text
  const rows = _.clamp((text.match(/\n/g) || []).length + 1, 2, 10);

  const placeholder = t('public~Expression (press Shift+Enter for newlines)');

  return (
    <div className="query-browser__query pf-c-dropdown">
      <textarea
        aria-label={placeholder}
        className="pf-c-form-control query-browser__query-input"
        onBlur={onBlur}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        rows={rows}
        spellCheck={false}
        value={text}
      />
      <CloseButton
        additionalClassName="query-browser__clear-icon"
        ariaLabel={t('public~Clear query')}
        onClick={onClear}
      />
      {!_.isEmpty(allSuggestions) && (
        <ul className="pf-c-dropdown__menu query-browser__metrics-dropdown-menu">
          {_.map(allSuggestions, (suggestions, title) => (
            <React.Fragment key={title}>
              <div className="text-muted query-browser__dropdown--subtitle">{title}</div>
              {_.map(suggestions, (s) => (
                <li key={s}>
                  <button
                    className="pf-c-dropdown__menu-item"
                    data-autocomplete={s}
                    onMouseDown={onMouseDown}
                    type="button"
                  >
                    <HighlightMatches text={s} token={token} />
                  </button>
                </li>
              ))}
            </React.Fragment>
          ))}
        </ul>
      )}
    </div>
  );
};
