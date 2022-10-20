import * as React from 'react';
import {
  Tabs,
  Tab,
  TabProps,
  Form,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
} from '@patternfly/react-core';
import { LockIcon } from '@patternfly/react-icons';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { LoadingBox, history } from '@console/internal/components/utils';
import { PageLayout, isModifiedEvent } from '@console/shared';
import ClusterConfigurationField from './ClusterConfigurationField';
import useClusterConfigurationGroups from './useClusterConfigurationGroups';
import useClusterConfigurationItems from './useClusterConfigurationItems';
import './ClusterConfigurationPage.scss';

export type ClusterConfigurationPageProps = RouteComponentProps<{ group: string }>;

const ClusterConfigurationPage: React.FC<ClusterConfigurationPageProps> = ({ match }) => {
  const { t } = useTranslation();

  const groupId = match.params.group || 'general';
  const onSelect = (event: React.MouseEvent<HTMLElement>, newGroupId: string) => {
    if (isModifiedEvent(event)) {
      return;
    }
    event.preventDefault();
    const path = match.path.includes(':group')
      ? match.path.replace(':group', newGroupId)
      : `${match.path}/${newGroupId}`;
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

  const tabs: React.ReactElement<TabProps>[] = clusterConfigurationGroups
    .filter((group) => clusterConfigurationItems.some((item) => group.id === item.groupId))
    .map((group) => {
      const items =
        groupId === group.id
          ? clusterConfigurationItems
              .filter((item) => item.groupId === group.id)
              .map((item) => <ClusterConfigurationField key={item.id} item={item} />)
          : null;

      return (
        <Tab key={group.id} eventKey={group.id} title={group.label} translate="no">
          <Form onSubmit={(event) => event.preventDefault()}>{items}</Form>
        </Tab>
      );
    });

  const groupNotFound = !clusterConfigurationGroups.some((group) => group.id === groupId);

  return (
    <div className="co-cluster-configuration-page">
      <Helmet>
        <title>{t('console-app~Cluster configuration')}</title>
      </Helmet>
      <PageLayout
        title={t('console-app~Cluster configuration')}
        hint={t(
          'console-app~Set cluster-wide configuration for the console experience. Your changes will be autosaved and will affect after a refresh.',
        )}
      >
        {!loaded ? (
          <LoadingBox />
        ) : tabs.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon icon={LockIcon} />
            <Title headingLevel="h1" size="lg">
              {t('console-app~Insufficient permissions')}
            </Title>
            <EmptyStateBody>
              {t(
                'console-app~You do not have sufficient permissions to read any cluster configuration.',
              )}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <>
            <Tabs isVertical activeKey={groupId} onSelect={onSelect}>
              {tabs}
            </Tabs>
            {groupNotFound ? (
              /* Similar to a TabContent */
              <section className="co-cluster-configuration-page pf-c-tab-content">
                <h1>{t('console-app~{{section}} not found', { section: groupId })}</h1>
              </section>
            ) : null}
          </>
        )}
      </PageLayout>
    </div>
  );
};

export default ClusterConfigurationPage;
