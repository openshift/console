import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';
import { MatchExpression, Operator } from '@console/internal/module/k8s';

const UNARY_OPERATORS = [Operator.Exists, Operator.DoesNotExist];
const ALL_OPERATORS: MatchExpression['operator'][] = [
  Operator.DoesNotExist,
  Operator.Equals,
  Operator.Exists,
  Operator.In,
  Operator.NotEqual,
  Operator.NotIn,
];

const MatchExpression: React.FC<MatchExpressionProps> = ({
  expression,
  onChange = () => {},
  allowedOperators = ALL_OPERATORS,
  onClickRemove = () => {},
}) => {
  const { key, operator, values } = expression;
  const { t } = useTranslation();
  return (
    <div className="row key-operator-value__row">
      <div className="col-md-4 col-xs-5 key-operator-value__name-field">
        <div className="key-operator-value__heading hidden-md hidden-lg text-secondary text-uppercase">
          {t('olm~Key')}
        </div>
        <input
          type="text"
          className="pf-c-form-control"
          value={expression.key ?? ''}
          onChange={(e) => onChange({ ...expression, key: e.target.value })}
        />
      </div>
      <div className="col-md-3 col-xs-5 key-operator-value__operator-field">
        <div className="key-operator-value__heading hidden-md hidden-lg text-secondary text-uppercase">
          {t('olm~Operator')}
        </div>
        <Dropdown
          dropDownClassName="dropdown--full-width"
          items={allowedOperators.reduce((acc, o) => ({ ...acc, [o]: o }), {})}
          onChange={(newOperator: Operator) => onChange({ key, operator: newOperator, values: [] })}
          selectedKey={expression.operator}
          title={expression.operator}
        />
      </div>
      <div className="col-md-3 col-xs-5 key-operator-value__value-field key-operator-value__value-field--stacked">
        <div className="key-operator-value__heading hidden-md hidden-lg text-secondary text-uppercase">
          {t('olm~Values')}
        </div>
        <input
          className="pf-c-form-control"
          type="text"
          value={values?.join(',') ?? ''}
          onChange={(e) =>
            onChange({
              key,
              operator,
              values: e.target?.value?.split(',')?.map((v) => v.trim()) ?? [],
            })
          }
          disabled={UNARY_OPERATORS.includes(operator as Operator)}
        />
      </div>
      <div className="col-xs-1 key-operator-value__action key-operator-value__action--stacked">
        <div className="key-operator-value__heading key-operator-value__heading-button hidden-md hidden-lg" />
        <Button
          type="button"
          onClick={onClickRemove}
          aria-label="Delete"
          className="key-operator-value__delete-button"
          variant="plain"
        >
          <MinusCircleIcon />
        </Button>
      </div>
    </div>
  );
};

export const MatchExpressions: React.FC<MatchExpressionsProps> = ({
  matchExpressions = [],
  onChange = () => {}, // Default to noop
  allowedOperators = ALL_OPERATORS,
  uid = '',
}) => {
  const { t } = useTranslation();

  const updateExpression = (index: number, newExpression: MatchExpression): void =>
    onChange(matchExpressions.map((exp, i) => (i === index ? newExpression : exp)));

  const removeExpression = (index: number): void =>
    onChange(matchExpressions.filter((_exp, i) => i !== index));

  const addExpression = (): void =>
    onChange([...matchExpressions, { key: '', operator: Operator.Exists, values: [] }]);

  return (
    <>
      <div className="row key-operator-value__heading hidden-sm hidden-xs">
        <div className="col-md-4 text-secondary text-uppercase">{t('olm~Key')}</div>
        <div className="col-md-3 text-secondary text-uppercase">{t('olm~Operator')}</div>
        <div className="col-md-3 text-secondary text-uppercase">{t('olm~Values')}</div>
      </div>
      {matchExpressions.map((expression, index) => (
        // Have to use array index in the key bc any other unique id whould have to use editable fields.
        <MatchExpression
          // eslint-disable-next-line react/no-array-index-key
          key={`${uid}-match-expression-${index}`}
          expression={expression}
          allowedOperators={allowedOperators}
          onClickRemove={() => removeExpression(index)}
          onChange={(newExpression) => updateExpression(index, newExpression)}
        />
      ))}
      <div className="row">
        <Button type="button" onClick={addExpression} variant="link">
          <PlusCircleIcon className="co-icon-space-r" />
          {t('olm~Add expression')}
        </Button>
      </div>
    </>
  );
};

export type MatchExpressionsProps = {
  matchExpressions: MatchExpression[];
  onChange?: (matchExpressions: MatchExpression[]) => void;
  allowedOperators?: MatchExpression['operator'][];
  uid?: string;
};

export type MatchExpressionProps = {
  expression: MatchExpression;
  onChange?: (expression: MatchExpression) => void;
  onClickRemove?: () => void;
  allowedOperators?: MatchExpression['operator'][];
};

MatchExpressions.displayName = 'MatchExpressions';
