import type { FC, Ref } from 'react';
import { useState } from 'react';
import {
  Alert,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownList,
  Grid,
  GridItem,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom-v5-compat';
import { ResourceSummary } from '@console/internal/components/utils/details-page';
import { SectionHeading } from '@console/internal/components/utils/headings';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { ClusterOperatorModel } from '@console/internal/models';
import { OAuthKind } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { IDP_TYPES } from '@console/shared/src/constants/auth';
import { useQueryParams } from '@console/shared/src/hooks/useQueryParams';
import { formatPrometheusDuration } from '@console/shared/src/utils/datetime';
import { IdentityProviders } from './IdentityProviders';

// Convert to ms for formatPrometheusDuration
const tokenDuration = (seconds: number) =>
  _.isNil(seconds) ? '-' : formatPrometheusDuration(seconds * 1000);

export const OAuthConfigDetails: FC<OAuthDetailsProps> = ({ obj }: { obj: OAuthKind }) => {
  const navigate = useNavigate();
  const [isIDPOpen, setIDPOpen] = useState(false);
  const { identityProviders, tokenConfig } = obj.spec;
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const idpAdded = queryParams.get('idpAdded');

  const getAddIDPItemLabels = (type: string) => {
    switch (type) {
      case 'Basic Authentication':
        return t('console-app~Basic Authentication');
      case 'GitHub':
        return t('console-app~GitHub');
      case 'GitLab':
        return t('console-app~GitLab');
      case 'Google':
        return t('console-app~Google');
      case 'HTPasswd':
        return t('console-app~HTPasswd');
      case 'Keystone':
        return t('console-app~Keystone');
      case 'LDAP':
        return t('console-app~LDAP');
      case 'OpenID Connect':
        return t('console-app~OpenID Connect');
      case 'Request Header':
        return t('console-app~Request Header');
      default:
        return type;
    }
  };

  const IDPDropdownItems = Object.entries(IDP_TYPES).map((idp) => {
    const [key, value] = idp;

    return (
      <DropdownItem
        key={`idp-${key}`}
        component="button"
        id={key}
        data-test-id={key}
        onClick={(e) => navigate(`/settings/idp/${e.currentTarget.id}`)}
      >
        {getAddIDPItemLabels(value)}
      </DropdownItem>
    );
  });

  return (
    <>
      <PaneBody>
        <SectionHeading text={t('console-app~OAuth details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={obj}>
              {tokenConfig && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('console-app~Access token max age')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {tokenDuration(tokenConfig.accessTokenMaxAgeSeconds)}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </ResourceSummary>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('console-app~Identity providers')} />
        <p className="co-m-pane__explanation co-m-pane__explanation--alt">
          {t('console-app~Identity providers determine how users log into the cluster.')}
        </p>
        {idpAdded === 'true' && (
          <Alert
            isInline
            className="co-alert"
            variant="info"
            title={t('console-app~New identity provider added.')}
          >
            <>
              {t(
                'console-app~Authentication is being reconfigured. The new identity provider will be available once reconfiguration is complete.',
              )}{' '}
              <Link to={resourcePathFromModel(ClusterOperatorModel, 'authentication')}>
                {t('console-app~View authentication conditions for reconfiguration status.')}
              </Link>
            </>
          </Alert>
        )}
        <div>
          <Dropdown
            isOpen={isIDPOpen}
            onSelect={() => setIDPOpen(false)}
            onOpenChange={(isOpen: boolean) => setIDPOpen(isOpen)}
            toggle={(toggleRef: Ref<MenuToggleElement>) => (
              <MenuToggle
                id="idp-dropdown"
                data-test-id="dropdown-button"
                ref={toggleRef}
                onClick={() => setIDPOpen(!isIDPOpen)}
                isExpanded={isIDPOpen}
              >
                {t('console-app~Add')}
              </MenuToggle>
            )}
            shouldFocusToggleOnSelect
            id="idp"
            popperProps={{}}
          >
            <DropdownList>{IDPDropdownItems}</DropdownList>
          </Dropdown>
        </div>

        <IdentityProviders obj={obj} identityProviders={identityProviders} />
      </PaneBody>
    </>
  );
};

type OAuthDetailsProps = {
  obj: OAuthKind;
};
