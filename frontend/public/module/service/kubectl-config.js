import {saveAs} from 'file-saver';
import {coFetch} from '../../co-fetch';


export const kubectlConfigSvc = {
  getVerificationCode: () => {
    window.open('api/tectonic/kubectl/code');
  },

  getConfiguration: code => {
    return coFetch('api/tectonic/kubectl/config', {
      method: 'POST',
      body: `code=${encodeURIComponent(code)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    }).then(res => res.text());
  },

  downloadConfiguration: config => {
    const blob = new Blob([config], { type: 'text/yaml;charset=utf-8' });
    saveAs(blob, 'kubectl-config');
  },
};
