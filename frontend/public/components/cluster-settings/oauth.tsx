import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Alert, Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';

import { useQueryParams } from '@console/shared';
import { ClusterOperatorModel, OAuthModel } from '../../models';
import { IdentityProvider, OAuthKind, referenceForModel } from '../../module/k8s';
import { DetailsPage } from '../factory';
import {
  EmptyBox,
  history,
  Kebab,
  navFactory,
  resourcePathFromModel,
  ResourceSummary,
  SectionHeading,
} from '../utils';
import { formatPrometheusDuration } from '../utils/datetime';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(OAuthModel), ...common];

const oAuthReference = referenceForModel(OAuthModel);

// Convert to ms for formatPrometheusDuration
const tokenDuration = (seconds: number) =>
  _.isNil(seconds) ? '-' : formatPrometheusDuration(seconds * 1000);

const IdentityProviders: React.FC<IdentityProvidersProps> = ({ identityProviders }) => {
  const { t } = useTranslation();
  return _.isEmpty(identityProviders) ? (
    <EmptyBox label={t('public~Identity providers')} />
  ) : (
    <div className="co-table-container">
      <table className="table">
        <thead>
          <tr>
            <th>{t('public~Name')}</th>
            <th>{t('public~Type')}</th>
            <th>{t('public~Mapping method')}</th>
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

const OAuthDetails: React.FC<OAuthDetailsProps> = ({ obj }: { obj: OAuthKind }) => {
  const [isIDPOpen, setIDPOpen] = React.useState(false);
  const { identityProviders, tokenConfig } = obj.spec;
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const idpAdded = queryParams.get('idpAdded');

  const getAddIDPItemLabels = (type: string) => {
    switch (type) {
      case 'Basic Authentication':
        return t('public~Basic Authentication');
      case 'GitHub':
        return t('public~GitHub');
      case 'GitLab':
        return t('public~GitLab');
      case 'Google':
        return t('public~Google');
      case 'HTPasswd':
        return t('public~HTPasswd');
      case 'Keystone':
        return t('public~Keystone');
      case 'LDAP':
        return t('public~LDAP');
      case 'OpenID Connect':
        return t('public~OpenID Connect');
      case 'Request Header':
        return t('public~Request Header');
      default:
        return type;
    }
  };

  const IDPDropdownItems = Object.entries(addIDPItems).map((idp) => {
    const [key, value] = idp;

    return (
      <DropdownItem
        key={`idp-${key}`}
        component="button"
        id={key}
        data-test-id={key}
        onClick={(e) => history.push(`/settings/idp/${e.currentTarget.id}`)}
      >
        {getAddIDPItemLabels(value)}
      </DropdownItem>
    );
  });

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~OAuth details')} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={obj}>
              {tokenConfig && (
                <>
                  <dt>{t('public~Access token max age')}</dt>
                  <dd>{tokenDuration(tokenConfig.accessTokenMaxAgeSeconds)}</dd>
                </>
              )}
            </ResourceSummary>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Identity providers')} />
        <p className="co-m-pane__explanation co-m-pane__explanation--alt">
          {t('public~Identity providers determine how users log into the cluster.')}
        </p>
        {idpAdded === 'true' && (
          <Alert
            isInline
            className="co-alert"
            variant="info"
            title={t('public~New identity provider added.')}
          >
            <>
              {t(
                'public~Authentication is being reconfigured. The new identity provider will be available once reconfiguration is complete.',
              )}{' '}
              <Link to={resourcePathFromModel(ClusterOperatorModel, 'authentication')}>
                {t('public~View authentication conditions for reconfiguration status.')}
              </Link>
            </>
          </Alert>
        )}
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
