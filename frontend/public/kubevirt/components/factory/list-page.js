import { isFunction } from 'lodash-es';

export const generateOnChange = (action, history) => {
  isFunction(action) ? action() : history.push(action);
};
