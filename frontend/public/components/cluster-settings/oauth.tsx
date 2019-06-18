import * as React from 'react';
import * as _ from 'lodash';

import { OAuthModel } from '../../models';
import { IdentityProvider, OAuthKind, referenceForModel } from '../../module/k8s';
import { DetailsPage } from '../factory';
import {
  Dropdown,
  EmptyBox,
  Kebab,
  ResourceSummary,
  SectionHeading,
  history,
  navFactory,
} from '../utils';
import { formatDuration } from '../utils/datetime';

const { common } = Kebab.factory;
const menuActions = [...common];

const oAuthReference = referenceForModel(OAuthModel);

// Convert to ms for formatDuration
const tokenDuration = (seconds: number) => _.isNil(seconds) ? '-' : formatDuration(seconds * 1000);

const IdentityProviders: React.SFC<IdentityProvidersProps> = ({identityProviders}) => {
  return _.isEmpty(identityProviders)
    ? <EmptyBox label="Identity Providers" />
    : <div className="co-table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Mapping Method</th>
          </tr>
        </thead>
        <tbody>
          {_.map(identityProviders, idp => (
            <tr key={idp.name}>
              <td>{idp.name}</td>
              <td>{idp.type}</td>
              <td>{idp.mappingMethod || 'claim'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>;
};

const OAuthDetails: React.SFC<OAuthDetailsProps> = ({obj}: {obj: OAuthKind}) => {
  const { identityProviders, tokenConfig } = obj.spec;
  const addIDPItems = {
    basicauth: 'Basic Authentication',
    github: 'GitHub',
    gitlab: 'GitLab',
    google: 'Google',
    htpasswd: 'HTPasswd',
    keystone: 'Keystone',
    ldap: 'LDAP',
    oidconnect: 'OpenID Connect',
    requestheader: 'Request Header',
  };
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="OAuth Overview" />
      <ResourceSummary resource={obj}>
        {tokenConfig && <React.Fragment>
          <dt>Access Token Max Age</dt>
          <dd>{tokenDuration(tokenConfig.accessTokenMaxAgeSeconds)}</dd>
        </React.Fragment>}
      </ResourceSummary>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Identity Providers" />
      <p className="co-m-pane__explanation co-m-pane__explanation--alt">
        Identity providers determine how users log into the cluster.
      </p>
      <Dropdown
        className="co-m-pane__dropdown"
        buttonClassName="btn-primary"
        title="Add"
        noSelection={true}
        items={addIDPItems}
        onChange={(name: string) => history.push(`/settings/idp/${name}`)} />
      <IdentityProviders identityProviders={identityProviders} />
    </div>
  </React.Fragment>;
};

export const OAuthDetailsPage: React.SFC<OAuthDetailsPageProps> = props => (
  <DetailsPage
    {...props}
    kind={oAuthReference}
    menuActions={menuActions}
    pages={[navFactory.details(OAuthDetails), navFactory.editYaml()]}
  />
);

type IdentityProvidersProps = {
  identityProviders: IdentityProvider[];
};

type OAuthDetailsProps = {
  obj: OAuthKind;
};

type OAuthDetailsPageProps = {
  match: any;
};
