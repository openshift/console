import * as React from 'react';
import { formatPrometheusDuration } from '@openshift-console/plugin-shared/src/datetime/prometheus';
import { Alert } from '@patternfly/react-core';
import {
  Dropdown as DropdownDeprecated,
  DropdownItem as DropdownItemDeprecated,
  DropdownToggle as DropdownToggleDeprecated,
} from '@patternfly/react-core/deprecated';
import { CaretDownIcon } from '@patternfly/react-icons/dist/esm/icons/caret-down-icon';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom-v5-compat';
import {
  resourcePathFromModel,
  ResourceSummary,
  SectionHeading,
} from '@console/internal/components/utils';
import { ClusterOperatorModel } from '@console/internal/models';
import { OAuthKind } from '@console/internal/module/k8s';
import { IDP_TYPES } from '@console/shared/src/constants/auth';
import { useQueryParams } from '@console/shared/src/hooks/useQueryParams';
import { IdentityProviders } from './IdentityProviders';

// Convert to ms for formatPrometheusDuration
const tokenDuration = (seconds: number) =>
  _.isNil(seconds) ? '-' : formatPrometheusDuration(seconds * 1000);

export const OAuthConfigDetails: React.FC<OAuthDetailsProps> = ({ obj }: { obj: OAuthKind }) => {
  const navigate = useNavigate();
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

  const IDPDropdownItems = Object.entries(IDP_TYPES).map((idp) => {
    const [key, value] = idp;

    return (
      <DropdownItemDeprecated
        key={`idp-${key}`}
        component="button"
        id={key}
        data-test-id={key}
        onClick={(e) => navigate(`/settings/idp/${e.currentTarget.id}`)}
      >
        {getAddIDPItemLabels(value)}
      </DropdownItemDeprecated>
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
        <DropdownDeprecated
          className="co-m-pane__dropdown"
          toggle={
            <DropdownToggleDeprecated
              id="idp-dropdown"
              onToggle={() => setIDPOpen(!isIDPOpen)}
              toggleIndicator={CaretDownIcon}
              data-test-id="dropdown-button"
            >
              {t('public~Add')}
            </DropdownToggleDeprecated>
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

type OAuthDetailsProps = {
  obj: OAuthKind;
};
