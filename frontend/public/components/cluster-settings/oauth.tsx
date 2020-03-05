import * as React from 'react';
import * as _ from 'lodash-es';

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

const menuActions = [...Kebab.factory.common];

const oAuthReference = referenceForModel(OAuthModel);

// Convert to ms for formatDuration
const tokenDuration = (seconds: number) =>
  _.isNil(seconds) ? '-' : formatDuration(seconds * 1000);

const IdentityProviders: React.SFC<IdentityProvidersProps> = ({ identityProviders }) => {
  return _.isEmpty(identityProviders) ? (
    <EmptyBox label="Identity Providers" />
  ) : (
    <div className="co-table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Mapping Method</th>
          </tr>
        </thead>
        <tbody>
          {_.map(identityProviders, (idp) => (
            <tr key={idp.name}>
              <td data-test-idp-name={idp.name}>{idp.name}</td>
              <td data-test-idp-type-for={idp.name}>{idp.type}</td>
              <td data-test-idp-mapping-for={idp.name}>{idp.mappingMethod || 'claim'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const addIDPItems = Object.freeze({
  basicauth: 'Basic Authentication',
  github: 'GitHub',
  gitlab: 'GitLab',
  google: 'Google',
  htpasswd: 'HTPasswd',
  keystone: 'Keystone',
  ldap: 'LDAP',
  oidconnect: 'OpenID Connect',
  requestheader: 'Request Header',
});

const OAuthDetails: React.SFC<OAuthDetailsProps> = ({ obj }: { obj: OAuthKind }) => {
  const { identityProviders, tokenConfig } = obj.spec;

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="OAuth Details" />
        <ResourceSummary resource={obj}>
          {tokenConfig && (
            <>
              <dt>Access Token Max Age</dt>
              <dd>{tokenDuration(tokenConfig.accessTokenMaxAgeSeconds)}</dd>
            </>
          )}
        </ResourceSummary>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Identity Providers" />
        <p className="co-m-pane__explanation co-m-pane__explanation--alt">
          Identity providers determine how users log into the cluster.
        </p>
        <Dropdown
          className="co-m-pane__dropdown"
          buttonClassName="pf-c-dropdown__toggle"
          title="Add"
          noSelection={true}
          items={addIDPItems}
          onChange={(name: string) => history.push(`/settings/idp/${name}`)}
        />
        <IdentityProviders identityProviders={identityProviders} />
      </div>
    </>
  );
};

export const OAuthDetailsPage: React.SFC<OAuthDetailsPageProps> = (props) => (
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
