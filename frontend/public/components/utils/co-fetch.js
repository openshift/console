import 'whatwg-fetch';

const initDefaults = {
  credentials: 'same-origin'
};

const validateStatus = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  var error = new Error(response.statusText);
  error.response = response;
  throw error;
};

export const coFetch = (input, init = {}) => {
  const mergedInit = _.defaults({}, initDefaults, init);
  return fetch(input, mergedInit).then(validateStatus);
};

const parseJson = (response) => response.json();

export const coFetchUtils = {
  parseJson
};
