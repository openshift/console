import * as React from 'react';
import * as _ from 'lodash';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { MatchExpression } from '@console/internal/module/k8s';
import { Dropdown } from '@console/internal/components/utils';

export const MatchExpressions: React.FC<MatchExpressionsProps> = (props) => {
  const { matchExpressions, onChangeMatchExpressions, allowedOperators } = props;

  const changeKey = (key: string, index: number) =>
    onChangeMatchExpressions(
      matchExpressions.map((exp, i) => (i === index ? _.set(exp, 'key', key) : exp)),
    );
  const changeOperator = (op: MatchExpression['operator'], index: number) =>
    onChangeMatchExpressions(
      matchExpressions.map((exp, i) => (i === index ? _.set(exp, 'operator', op) : exp)),
    );
  const changeValue = (value: string, index: number) =>
    onChangeMatchExpressions(
      matchExpressions.map((exp, i) => (i === index ? _.set(exp, 'value', value) : exp)),
    );

  return (
    <>
      <div className="row key-operator-value__heading hidden-sm hidden-xs">
        <div className="col-md-4 text-secondary text-uppercase">Key</div>
        <div className="col-md-3 text-secondary text-uppercase">Operator</div>
        <div className="col-md-3 text-secondary text-uppercase">Value</div>
      </div>
      {props.matchExpressions.map((expression, i) => (
        <div className="row key-operator-value__row" key={JSON.stringify(expression)}>
          <div className="col-md-4 col-xs-5 key-operator-value__name-field">
            <div className="key-operator-value__heading hidden-md hidden-lg text-secondary text-uppercase">
              Key
            </div>
            <input
              type="text"
              className="pf-c-form-control"
              value={expression.key}
              onChange={(e) => changeKey(e.target.value, i)}
            />
          </div>
          <div className="col-md-3 col-xs-5 key-operator-value__operator-field">
            <div className="key-operator-value__heading hidden-md hidden-lg text-secondary text-uppercase">
              Operator
            </div>
            <Dropdown
              dropDownClassName="dropdown--full-width"
              items={allowedOperators.reduce((acc, o) => ({ ...acc, [o]: o }), {})}
              onChange={(op: MatchExpression['operator']) => changeOperator(op, i)}
              selectedKey={expression.operator}
              title={expression.operator}
            />
          </div>
          <div className="col-md-3 col-xs-5 key-operator-value__value-field key-operator-value__value-field--stacked">
            <div className="key-operator-value__heading hidden-md hidden-lg text-secondary text-uppercase">
              Value
            </div>
            <input
              className="pf-c-form-control"
              type="text"
              value={(expression as any).value || ''}
              onChange={(e) => changeValue(e.target.value, i)}
              readOnly={['Exists', 'DoesNotExist'].includes(expression.operator)}
            />
          </div>
          <div className="col-xs-1 key-operator-value__action key-operator-value__action--stacked">
            <div className="key-operator-value__heading key-operator-value__heading-button hidden-md hidden-lg" />
            <Button
              type="button"
              onClick={() =>
                props.onChangeMatchExpressions(
                  props.matchExpressions.filter((e, index) => index !== i),
                )
              }
              aria-label="Delete"
              className="key-operator-value__delete-button"
              variant="plain"
            >
              <MinusCircleIcon />
            </Button>
          </div>
        </div>
      ))}
      <div className="row">
        <Button
          type="button"
          onClick={() =>
            onChangeMatchExpressions(matchExpressions.concat({ key: '', operator: 'Exists' }))
          }
          variant="link"
        >
          <PlusCircleIcon className="co-icon-space-r" />
          Add More
        </Button>
      </div>
    </>
  );
};

export type MatchExpressionsProps = {
  matchExpressions: MatchExpression[];
  onChangeMatchExpressions: (matchExpressions: MatchExpression[]) => void;
  allowedOperators: MatchExpression['operator'][];
};

MatchExpressions.displayName = 'MatchExpressions';
