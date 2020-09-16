import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';

import { OAuthModel } from '../../models';
import { IdentityProvider, OAuthKind, referenceForModel } from '../../module/k8s';
import { DetailsPage } from '../factory';
import { EmptyBox, Kebab, ResourceSummary, SectionHeading, history, navFactory } from '../utils';
import { formatDuration } from '../utils/datetime';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(OAuthModel), ...common];

const oAuthReference = referenceForModel(OAuthModel);

// Convert to ms for formatDuration
const tokenDuration = (seconds: number) =>
  _.isNil(seconds) ? '-' : formatDuration(seconds * 1000);

const IdentityProviders: React.FC<IdentityProvidersProps> = ({ identityProviders }) => {
  const { t } = useTranslation();
  return _.isEmpty(identityProviders) ? (
    <EmptyBox label={t('oauth~Identity providers')} />
  ) : (
    <div className="co-table-container">
      <table className="table">
        <thead>
          <tr>
            <th>{t('oauth~Name')}</th>
            <th>{t('oauth~Type')}</th>
            <th>{t('oauth~Mapping method')}</th>
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

// t('oauth~Basic Authentication')
// t('oauth~GitHub')
// t('oauth~GitLab')
// t('oauth~Google')
// t('oauth~HTPasswd')
// t('oauth~Keystone')
// t('oauth~LDAP')
// t('oauth~OpenID Connect')
// t('oauth~Request Header')
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

const OAuthDetails: React.FC<OAuthDetailsProps> = ({ obj }: { obj: OAuthKind }) => {
  const [isIDPOpen, setIDPOpen] = React.useState(false);
  const { identityProviders, tokenConfig } = obj.spec;
  const { t } = useTranslation();

  const IDPDropdownItems = _.keys(addIDPItems).map((idp) => {
    const label = t('oauth~{{label}}', { label: addIDPItems[idp] });
    return (
      <DropdownItem
        key={`idp-${addIDPItems[idp]}`}
        component="button"
        id={idp}
        data-test-id={idp}
        onClick={(e) => history.push(`/settings/idp/${e.currentTarget.id}`)}
      >
        {label}
      </DropdownItem>
    );
  });

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('oauth~{{resource}} details', { resource: OAuthModel.label })} />
        <ResourceSummary resource={obj}>
          {tokenConfig && (
            <>
              <dt>{t('oauth~Access token max age')}</dt>
              <dd>{tokenDuration(tokenConfig.accessTokenMaxAgeSeconds)}</dd>
            </>
          )}
        </ResourceSummary>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('oauth~Identity providers')} />
        <p className="co-m-pane__explanation co-m-pane__explanation--alt">
          {t('oauth~Identity providers determine how users log into the cluster.')}
        </p>
        <Dropdown
          className="co-m-pane__dropdown"
          toggle={
            <DropdownToggle
              id="idp-dropdown"
              onToggle={() => setIDPOpen(!isIDPOpen)}
              toggleIndicator={CaretDownIcon}
              data-test-id="dropdown-button"
            >
              {t('public~Add')}
            </DropdownToggle>
          }
          isOpen={isIDPOpen}
          dropdownItems={IDPDropdownItems}
          onSelect={() => setIDPOpen(false)}
          id="idp"
        />
        <IdentityProviders identityProviders={identityProviders} />
      </div>
    </>
  );
};

export const OAuthDetailsPage: React.FC<OAuthDetailsPageProps> = (props) => (
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
