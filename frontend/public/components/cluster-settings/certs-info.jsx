import * as _ from 'lodash-es';
import * as React from 'react';

import { coFetchJSON } from '../../co-fetch';
import { SettingsRow, SettingsLabel, SettingsContent } from './cluster-settings';
import { SafetyFirst } from '../safety-first';
import { Timestamp, ResourceLink } from '../utils';

export class CertsInfoContainer extends SafetyFirst {
  constructor(props){
    super(props);
    this.state = {
      info : null
    };
  }

  componentDidMount() {
    super.componentDidMount();
    this._getCertInfo();
  }

  _getCertInfo() {
    coFetchJSON('api/tectonic/certs')
      .then((info) => {
        this.setState({ info });
      })
      .catch(() => {
        this.setState({ info: null });
      });
  }

  render() {
    return <CertsInfo info={this.state.info} />;
  }
}

const getCertDate = (name, info) => {
  if (!info) {
    return null;
  }

  return _.isEmpty(info[name].errorMessage) ? info[name].expirationDate : null;
};

export const CertsInfo = (props) => {
  const caCertDate = getCertDate('ca-cert', props.info);

  return <div>
    {caCertDate && <SettingsRow>
      <SettingsLabel>CA Certificate</SettingsLabel>
      <SettingsContent>
        <div className="certs-info-cert">
          <ResourceLink kind="Secret" name="tectonic-ca-cert-secret" namespace="tectonic-system" displayName="Tectonic CA certificate" />
        </div>
        <div>
          Expires: <div className="certs-info-exp">
            <Timestamp timestamp={caCertDate} isUnix={true} />
          </div>
        </div>
      </SettingsContent>
    </SettingsRow>}
  </div>;
};
