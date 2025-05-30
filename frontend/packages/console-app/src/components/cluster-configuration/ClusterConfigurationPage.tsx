import * as React from 'react';
import { IconStatus, Status } from '@patternfly/react-component-groups/dist/dynamic/Status';
import {
  Tabs,
  Tab,
  TabProps,
  EmptyState,
  EmptyStateBody,
  TabContent,
  TabContentProps,
  TabTitleText,
  PageSection,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { LockIcon } from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { LoadingBox, history } from '@console/internal/components/utils';
import { isModifiedEvent } from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import ClusterConfigurationForm from './ClusterConfigurationForm';
import { getClusterConfigurationGroups } from './getClusterConfigurationGroups';
import { ClusterConfigurationTabGroup } from './types';
import useClusterConfigurationGroups from './useClusterConfigurationGroups';
import useClusterConfigurationItems from './useClusterConfigurationItems';

import './ClusterConfigurationPage.scss';

const ClusterConfigurationPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();

  const initialGroupId = params.group || 'general';
  const [activeTabId, setActiveTabId] = React.useState<string>(initialGroupId);
  const onSelect = (event: React.MouseEvent<HTMLElement>, newGroupId: string) => {
    if (isModifiedEvent(event)) {
      return;
    }
    event.preventDefault();
    setActiveTabId(newGroupId);
    const path = `/cluster-configuration/${newGroupId}`;
    history.replace(path);
  };

  const [
    clusterConfigurationGroups,
    clusterConfigurationGroupsResolved,
  ] = useClusterConfigurationGroups();

  const [
    clusterConfigurationItems,
    clusterConfigurationItemsResolved,
  ] = useClusterConfigurationItems();

  const loaded = clusterConfigurationGroupsResolved && clusterConfigurationItemsResolved;

  const [clusterConfigurationTabs, clusterConfigurationTabContents] = React.useMemo<
    [React.ReactElement<TabProps>[], React.ReactElement<TabContentProps>[]]
  >(() => {
    const populatedClusterCongigurationGroups: ClusterConfigurationTabGroup[] = getClusterConfigurationGroups(
      clusterConfigurationGroups,
      clusterConfigurationItems,
    );
    const [tabs, tabContents] = populatedClusterCongigurationGroups.reduce(
      (acc, currGroup) => {
        const { id, label, items } = currGroup;
        const ref = React.createRef<HTMLElement>();
        acc[0].push(
          <Tab
            key={id}
            eventKey={id}
            title={<TabTitleText>{label}</TabTitleText>}
            href={`/cluster-configuration/${id}`}
            tabContentId={id}
            tabContentRef={ref}
            data-test={`tab ${id}`}
          />,
        );
        acc[1].push(
          <TabContent
            key={id}
            eventKey={id}
            id={id}
            ref={ref}
            data-test={`tab-content ${id}`}
            hidden={id !== activeTabId}
          >
            <ClusterConfigurationForm items={items} />
          </TabContent>,
        );
        return acc;
      },
      [[], []],
    );
    return [tabs, tabContents];
  }, [activeTabId, clusterConfigurationGroups, clusterConfigurationItems]);

  const groupNotFound = !clusterConfigurationGroups.some((group) => group.id === activeTabId);

  return (
    <div className="co-cluster-configuration-page">
      <DocumentTitle>{t('console-app~Cluster configuration')}</DocumentTitle>
      <PageHeading
        title={t('console-app~Cluster configuration')}
        helpText={t(
          'console-app~Set cluster-wide configuration for the console experience. Your changes will be autosaved and will affect after a refresh.',
        )}
      />
      <PageSection>
        {!loaded ? (
          <LoadingBox />
        ) : clusterConfigurationTabs.length === 0 ? (
          <EmptyState
            headingLevel="h1"
            icon={LockIcon}
            titleText={<>{t('console-app~Insufficient permissions')}</>}
          >
            <EmptyStateBody>
              {t(
                'console-app~You do not have sufficient permissions to read any cluster configuration.',
              )}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <>
            <div className="co-cluster-configuration-page-content">
              <div className="co-cluster-configuration-page-content__tabs">
                <Tabs
                  activeKey={activeTabId}
                  onSelect={onSelect}
                  isVertical
                  data-test="user-preferences tabs"
                >
                  <>{clusterConfigurationTabs}</>
                </Tabs>
              </div>
              <div className="co-cluster-configuration-page-content__tab-content">
                {clusterConfigurationTabContents}
              </div>
            </div>
            {groupNotFound ? (
              /* Similar to a TabContent */
              <section className="co-cluster-configuration-page pf-v6-c-tab-content">
                <Status
                  status={IconStatus.warning}
                  icon={<ExclamationTriangleIcon />}
                  label={t('console-app~{{section}} not found', { section: activeTabId })}
                />
              </section>
            ) : null}
          </>
        )}
      </PageSection>
    </div>
  );
};

export default ClusterConfigurationPage;
