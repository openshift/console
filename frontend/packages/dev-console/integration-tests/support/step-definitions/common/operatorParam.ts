/**
 * This file is responsible for defining new parameter that can be then used
 * in Feature files. This parameter represents and operator and it feeds data
 * from `operators` enum (frontend/packages/dev-console/integration-tests/support/constants/global.ts)
 */

import { defineParameterType } from 'cypress-cucumber-preprocessor/steps';
import { operators } from '../../constants';

const getOperatorsValues = (): string[] => {
  const operatorsValues: string[] = [];
  for (const operator in operators) {
    if (operators.hasOwnProperty(operator)) {
      operatorsValues.push(operators[operator as keyof typeof operators]);
    }
  }
  return operatorsValues;
};

defineParameterType({
  name: 'operator',
  regexp: new RegExp(getOperatorsValues().join('|')),
  transformer: (s) => {
    const keys = Object.keys(operators).filter((x) => operators[x as keyof typeof operators] === s);
    if (keys.length > 0) {
      return operators[keys[0] as keyof typeof operators];
    }
    throw new Error(`Given key is not part of "operators" enum.`);
  },
});
