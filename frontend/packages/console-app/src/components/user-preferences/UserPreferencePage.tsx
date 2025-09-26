import { useMemo, useState, useEffect, createRef } from 'react';
import {
  Tabs,
  Tab,
  TabProps,
  TabTitleText,
  TabContent,
  TabContentProps,
  PageSection,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import {
  useResolvedExtensions,
  UserPreferenceGroup,
  isUserPreferenceGroup,
  UserPreferenceItem,
  isUserPreferenceItem,
} from '@console/dynamic-plugin-sdk';
import { LoadingBox, history } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk/src';
import {
  isModifiedEvent,
  orderExtensionBasedOnInsertBeforeAndAfter,
  useQueryParams,
  Spotlight,
} from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { USER_PREFERENCES_BASE_URL } from './const';
import {
  UserPreferenceTabGroup,
  ResolvedUserPreferenceItem,
  ResolvedUserPreferenceGroup,
} from './types';
import UserPreferenceForm from './UserPreferenceForm';
import { getUserPreferenceGroups } from './utils/getUserPreferenceGroups';
import './UserPreferencePage.scss';

const UserPreferencePage: React.FC = () => {
  // resources and calls to hooks
  const { t } = useTranslation();

  const userPreferenceGroupExtensions = useExtensions<UserPreferenceGroup>(isUserPreferenceGroup);
  const sortedUserPreferenceGroups = orderExtensionBasedOnInsertBeforeAndAfter<
    ResolvedUserPreferenceGroup
  >(userPreferenceGroupExtensions.map(({ properties }) => properties));

  const [userPreferenceItemExtensions, userPreferenceItemResolved] = useResolvedExtensions<
    UserPreferenceItem
  >(isUserPreferenceItem);
  const sortedUserPreferenceItems = orderExtensionBasedOnInsertBeforeAndAfter<
    ResolvedUserPreferenceItem
  >(userPreferenceItemExtensions.map(({ properties }) => properties));

  // fetch the default user preference group from the url params if available
  const { group: groupIdFromUrl } = useParams();
  const initialTabId =
    sortedUserPreferenceGroups.find((extension) => extension.id === groupIdFromUrl)?.id ||
    sortedUserPreferenceGroups[0]?.id ||
    'general';
  const [activeTabId, setActiveTabId] = useState<string>(initialTabId);

  const [userPreferenceTabs, userPreferenceTabContents] = useMemo<
    [
      React.ReactElement<TabProps, React.JSXElementConstructor<TabProps>>[],
      React.ReactElement<TabContentProps>[],
    ]
  >(() => {
    const populatedUserPreferenceGroups: UserPreferenceTabGroup[] = getUserPreferenceGroups(
      sortedUserPreferenceGroups,
      sortedUserPreferenceItems,
    );
    const [tabs, tabContents] = populatedUserPreferenceGroups.reduce<
      [
        React.ReactElement<TabProps, React.JSXElementConstructor<TabProps>>[],
        React.ReactElement<TabContentProps>[],
      ]
    >(
      (acc, currGroup) => {
        const { id, label, items } = currGroup;
        const ref = createRef<HTMLElement>();
        acc[0].push(
          <Tab
            key={id}
            eventKey={id}
            title={<TabTitleText>{label}</TabTitleText>}
            href={`${USER_PREFERENCES_BASE_URL}/${id}`}
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
            hidden={id !== activeTabId}
            data-test={`tab-content ${id}`}
          >
            <UserPreferenceForm items={items} />
          </TabContent>,
        );
        return acc;
      },
      [[], []],
    );
    return [tabs, tabContents];
  }, [activeTabId, sortedUserPreferenceGroups, sortedUserPreferenceItems]);

  const queryParams = useQueryParams();
  const spotlightParam = queryParams.get('spotlight');
  const spotlight = spotlightParam ? decodeURIComponent(spotlightParam) : '';
  const [spotlightElement, setSpotlightElement] = useState<Element | null>(null);

  useEffect(() => {
    setActiveTabId(groupIdFromUrl ?? 'general');
    if (spotlight) {
      const element = document.querySelector(spotlight);
      setSpotlightElement(element);
    }
  }, [groupIdFromUrl, spotlight, userPreferenceItemResolved, userPreferenceTabContents]);

  // utils and callbacks
  const handleTabClick = (event: React.MouseEvent<HTMLElement>, eventKey: string) => {
    if (isModifiedEvent(event)) {
      return;
    }
    event.preventDefault();
    setActiveTabId(eventKey);
    history.replace(`${USER_PREFERENCES_BASE_URL}/${eventKey}`);
  };
  const activeTab = sortedUserPreferenceGroups.find((group) => group.id === activeTabId)?.label;
  return (
    <div className="co-user-preference-page">
      <DocumentTitle>
        {activeTab
          ? t('console-app~User Preferences {{activeTab}}', { activeTab })
          : t('console-app~User Preferences')}
      </DocumentTitle>
      <PageHeading
        title={t('console-app~User Preferences')}
        helpText={t(
          'console-app~Set your individual preferences for the console experience. Any changes will be autosaved.',
        )}
      />
      <PageSection>
        {userPreferenceItemResolved ? (
          <div className="co-user-preference-page-content">
            <div className="co-user-preference-page-content__tabs">
              <Tabs
                activeKey={activeTabId}
                onSelect={handleTabClick}
                isVertical
                variant="secondary"
                data-test="user-preferences tabs"
              >
                {userPreferenceTabs}
              </Tabs>
            </div>
            <div className="co-user-preference-page-content__tab-content">
              {userPreferenceTabContents}
              {spotlight && spotlightElement && <Spotlight selector={spotlight} interactive />}
            </div>
          </div>
        ) : (
          <LoadingBox />
        )}
      </PageSection>
    </div>
  );
};

export default UserPreferencePage;
