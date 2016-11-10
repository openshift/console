import React from 'react';

import {coFetch, coFetchJSON} from '../../co-fetch';
import {angulars} from '../react-wrapper';
import {SettingsRow, SettingsLabel, SettingsContent} from './cluster-settings';
import {SettingsModalLink} from './settings-modal-link';

export class LicenseSetting extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      outdate: false,
      expiration: null,
      tier: null
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this._queryLicense();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentWillReceiveProps() {
    this._updateOutdated(false);
  }

  _queryLicense() {
    coFetchJSON('version')
      .then(this._update.bind(this))
      .then(this._updateOutdated.bind(this))
      .catch((error) => {
        // fail silently
        this._updateOutdated(false);
        // eslint-disable-next-line no-console
        console.error('Could not load Tectonic version', error);
      });
  }

  _update(json) {
    if (!this._isMounted) {
      return;
    }
    this.setState({
      expiration: json.expiration,
      tier: json.tier
    });
  }

  _tierName() {
    return _.words(this.state.tier).map(function(word) { return _.capitalize(word); }).join(' ');
  }

  _updateOutdated(outdated) {
    if (!this._isMounted) {
      return;
    }
    this.setState({
      outdated
    });
  }

  _openModal() {
    const modal = angulars.modal('configure-yaml-field', {
      k8sQuery: {
        kind: angulars.kinds.SECRET,
        name: 'tectonic-license',
        namespace: 'tectonic-system'
      },
      path: 'data.license',
      inputType: 'textarea',
      modalText: 'Enter a new value for the Tectonic License. Changes may take a few minutes to take effect.',
      modalTitle: 'Update Tectonic License',
      callbacks: {
        invalidateState: this._updateOutdated.bind(this),
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
                  data: {
                    message: json.error
                  }
                };
                throw error;
              }
              return value;
            });
          });
        }
      }
    })();

    modal.result.then(this._queryLicense.bind(this)).catch(this._updateOutdated.bind(this, false));
  }

  render() {
    return <SettingsRow>
      <SettingsLabel>Tectonic License:</SettingsLabel>
      <SettingsContent>
        <SettingsModalLink onClick={this._openModal.bind(this)} outdated={this.state.outdated}>{this._tierName()}</SettingsModalLink>
      </SettingsContent>
    </SettingsRow>;
  }
}
