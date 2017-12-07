import { authSvc } from '../../module/auth';

const token = authSvc.getToken();

export const stream = (url, loadStart, notify) => {
  const xhr = new XMLHttpRequest();

  const promise = new Promise((resolve, reject) => {
    let offset = 0;

    const nextChunk = () => {
      let remainder = xhr.responseText.substr(offset);
      // Work around a bug in v8 that causes excessive memory usage (https://bugs.chromium.org/p/v8/issues/detail?id=2869)
      remainder = `.${remainder}`.substr(1);
      offset = xhr.responseText.length;
      notify(remainder);
    };

    const processResponse = (evt) => {
      const response = evt.target;

      if (response.status === 200) {
        resolve();
      } else {
        let msg = 'error';
        if (response.responseText) {
          try {
            msg = JSON.parse(response.responseText).message;
          } catch (e) {
            throw new Error(e);
          }
        }
        reject(msg);
      }
    };

    xhr.addEventListener('progress', nextChunk);
    xhr.addEventListener('loadstart', loadStart);
    xhr.addEventListener('load', nextChunk);
    xhr.addEventListener('loadend', processResponse);
    xhr.addEventListener('error', () => {
      reject('error');
    });
    xhr.addEventListener('abort', () => {
      reject('abort');
    });

    xhr.open('GET', url, true);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send();
  });

  return {
    promise,
    abort: () => {
      xhr.abort();
    }
  };
};
