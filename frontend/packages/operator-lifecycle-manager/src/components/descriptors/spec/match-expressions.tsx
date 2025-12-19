import type { FC } from 'react';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { css } from '@patternfly/react-styles';
import { Table, Thead, Tr, Th, Td, Tbody } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
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

const MatchExpression: FC<MatchExpressionProps> = ({
  expression,
  onChange = () => {},
  allowedOperators = ALL_OPERATORS,
  onClickRemove = () => {},
}) => {
  const { key, operator, values } = expression;
  const { t } = useTranslation();
  const valuesDisabled = UNARY_OPERATORS.includes(operator as Operator);
  return (
    <Tr>
      <Td dataLabel={t('olm~Key')}>
        <span className="pf-v6-c-form-control">
          <input
            type="text"
            value={expression.key ?? ''}
            onChange={(e) => onChange({ ...expression, key: e.target.value })}
          />
        </span>
      </Td>
      <Td dataLabel={t('olm~Operator')}>
        <ConsoleSelect
          isFullWidth
          items={allowedOperators.reduce((acc, o) => ({ ...acc, [o]: o }), {})}
          onChange={(newOperator: Operator) => onChange({ key, operator: newOperator, values: [] })}
          selectedKey={expression.operator}
          title={expression.operator}
        />
      </Td>
      <Td dataLabel={t('olm~Values')}>
        <span
          className={css('pf-v6-c-form-control', {
            'pf-m-disabled': valuesDisabled,
          })}
        >
          <input
            type="text"
            value={values?.join(',') ?? ''}
            onChange={(e) =>
              onChange({
                key,
                operator,
                values: e.target?.value?.split(',')?.map((v) => v.trim()) ?? [],
              })
            }
            disabled={valuesDisabled}
          />
        </span>
      </Td>
      <Td isActionCell>
        <Button
          icon={<MinusCircleIcon />}
          type="button"
          onClick={onClickRemove}
          aria-label="Delete"
          variant="plain"
        />
      </Td>
    </Tr>
  );
};

export const MatchExpressions: FC<MatchExpressionsProps> = ({
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
    <Table aria-label={t('olm~Match expressions')} variant="compact" borders={false}>
      <Thead>
        <Tr>
          <Th>{t('olm~Key')}</Th>
          <Th>{t('olm~Operator')}</Th>
          <Th>{t('olm~Values')}</Th>
          <Th />
        </Tr>
      </Thead>
      <Tbody>
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
        <Tr>
          <Td>
            <Button
              icon={<PlusCircleIcon className="co-icon-space-r" />}
              type="button"
              onClick={addExpression}
              variant="link"
            >
              {t('olm~Add expression')}
            </Button>
          </Td>
        </Tr>
      </Tbody>
    </Table>
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
