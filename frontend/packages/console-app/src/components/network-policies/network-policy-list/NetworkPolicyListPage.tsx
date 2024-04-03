import * as React from 'react';
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom-v5-compat';
import { ListPage } from '@console/internal/components/factory';
import { NetworkPoliciesList } from '@console/internal/components/network-policy';
import useIsMultiNetworkPolicy from '../useIsMultiNetworkPolicy';
import { multiNetworkPolicyRef, networkPolicyRef, TAB_INDEXES } from './constants';
import EnableMultiPage from './EnableMultiPage';
import useIsMultiEnabled from './useIsMultiEnabled';
import { getActiveKeyFromPathname, isDisplayedInDeveloperSearchPage } from './utils';

import './network-policy-list-page.scss';

export type NetworkPolicyPageNavProps = {
  namespace: string;
  kind: string;
};

export const NetworkPolicyListPage: React.FC<NetworkPolicyPageNavProps> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const namespace = React.useMemo(() => params.ns || 'default', [params.ns]);

  const [activeTabKey, setActiveTabKey] = React.useState<number | string>(
    getActiveKeyFromPathname(location),
  );

  const [isMultiEnabled] = useIsMultiEnabled();
  const isMulti = useIsMultiNetworkPolicy();

  React.useEffect(() => {
    if (isDisplayedInDeveloperSearchPage(location.pathname)) return;

    if (activeTabKey === TAB_INDEXES.ENABLE_MULTI) {
      navigate(`/k8s/ns/${namespace}/networkpolicies/~enable-multi`);
      return;
    }

    navigate(
      `/k8s/ns/${namespace}/${
        activeTabKey === TAB_INDEXES.NETWORK ? networkPolicyRef : multiNetworkPolicyRef
      }`,
    );
  }, [activeTabKey, namespace, location.pathname, navigate]);

  const { t } = useTranslation();

  if (isDisplayedInDeveloperSearchPage(location.pathname)) {
    return (
      <ListPage
        ListComponent={NetworkPoliciesList}
        canCreate
        createProps={{
          to: `/k8s/${namespace}/${isMulti ? multiNetworkPolicyRef : networkPolicyRef}/~new/form`,
        }}
        {...props}
      />
    );
  }

  return (
    <Tabs
      activeKey={activeTabKey}
      onSelect={(_, tabIndex: number | string) => {
        setActiveTabKey(tabIndex);
      }}
      className="network-policy-list-page"
    >
      <Tab
        eventKey={TAB_INDEXES.NETWORK}
        title={<TabTitleText>{t('console-app~NetworkPolicies')}</TabTitleText>}
      >
        <ListPage
          ListComponent={NetworkPoliciesList}
          canCreate
          createProps={{
            to: `/k8s/ns/${namespace}/${networkPolicyRef}/~new/form`,
          }}
          {...props}
        />
      </Tab>
      {isMultiEnabled ? (
        <Tab
          eventKey={TAB_INDEXES.MULTI_NETWORK}
          title={<TabTitleText>{t('console-app~MultiNetworkPolicies')}</TabTitleText>}
        >
          <ListPage
            ListComponent={NetworkPoliciesList}
            canCreate
            createProps={{
              to: `/k8s/ns/${namespace}/${multiNetworkPolicyRef}/~new/form`,
            }}
            {...props}
          />
        </Tab>
      ) : (
        <Tab
          eventKey={TAB_INDEXES.ENABLE_MULTI}
          title={<TabTitleText>{t('console-app~MultiNetworkPolicies')}</TabTitleText>}
        >
          <EnableMultiPage />
        </Tab>
      )}
    </Tabs>
  );
};
