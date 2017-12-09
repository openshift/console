import * as _ from 'lodash';
import {coFetch} from '../../co-fetch';
import {configureYamlFieldModal} from './configure-yaml-field-modal';

export const updateLicenseModal = (additionalOptions) => {
  const options = _.defaultsDeep({}, additionalOptions, {
    k8sQuery: {
      kind: 'Secret',
      name: 'tectonic-license-secret',
      namespace: 'tectonic-system'
    },
    path: 'data.license',
    inputType: 'textarea',
    modalText: 'Enter a new value for the Tectonic License. Changes may take a few minutes to take effect.',
    modalTitle: 'Update Tectonic License',
    callbacks: {
      inputValidator: (value) => {
        const data = new FormData();
        data.append('license', value);
        return coFetch('license/validate', {
          method: 'POST',
          body: data
        }).then((response) => {
          return response.json().then((json) => {
            if (json.error) {
              const error = {
                message: json.error
              };
              throw error;
            }
            return value;
          });
        });
      }
    }
  });
  return configureYamlFieldModal(options);
};
