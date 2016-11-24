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

export const coFetchJSON = (...args) => coFetch(...args).then(parseJson);

export const coFetchUtils = {
  parseJson
};

export const coFetchPostJSON = (url, json, options={}) => {
  const options_ = _.defaults({
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(json),
  }, initDefaults, options);
  return coFetch(url, options_).then(parseJson);
};
