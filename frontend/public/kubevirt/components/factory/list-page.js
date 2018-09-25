import { isFunction } from 'lodash';

export const generateOnChange = (action, history) => {
  isFunction(action) ? action() : history.push(action);
};
