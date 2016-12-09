const initDefaults = {
  credentials: 'same-origin'
};

const validateStatus = (response) => {
  if (response.ok) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
};

export const coFetch = (url, options = {}) => {
  const allOptions = _.defaultsDeep({}, initDefaults, options);
  return fetch(url, allOptions).then(validateStatus);
};

const parseJson = (response) => response.json();

export const coFetchUtils = {
  parseJson
};

export const coFetchJSON = (url, method = 'GET', options = {}) => {
  const allOptions = _.defaultsDeep({
    method,
    headers: {
      Accept: 'application/json',
    },
  }, options);

  return coFetch(url, allOptions).then(response => {
    // If the response has no body, return promise that resolves with an empty object
    if (response.headers.get('Content-Length') === '0') {
      return Promise.resolve({});
    }
    return response.json();
  });
};

const coFetchSendJSON = (url, method, json = undefined, options = {}) => {
  const allOptions = {
    headers: {
      Accept: 'application/json',
      'Content-Type': `application/${method === 'PATCH' ? 'json-patch+json' : 'json'};charset=UTF-8`,
    },
  };
  if(json) {
    allOptions.body = JSON.stringify(json);
  }
  return coFetchJSON(url, method, _.defaultsDeep(allOptions, options));
};

coFetchJSON.delete = (url, options = {}) => coFetchJSON(url, 'DELETE', options);
coFetchJSON.post = (url, json, options = {}) => coFetchSendJSON(url, 'POST', json, options);
coFetchJSON.put = (url, json, options = {}) => coFetchSendJSON(url, 'PUT', json, options);
coFetchJSON.patch = (url, json, options = {}) => coFetchSendJSON(url, 'PATCH', json, options);
