import * as React from 'react';
import {
  Tabs,
  Tab,
  TabProps,
  TabTitleText,
  TabContent,
  TabContentProps,
} from '@patternfly/react-core';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
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
  PageLayout,
} from '@console/shared';
import { USER_PREFERENCES_BASE_URL } from './const';
import {
  UserPreferenceTabGroup,
  ResolvedUserPreferenceItem,
  ResolvedUserPreferenceGroup,
} from './types';
import UserPreferenceForm from './UserPreferenceForm';
import { getUserPreferenceGroups } from './utils/getUserPreferenceGroups';
import './UserPreferencePage.scss';

export type UserPreferencePageProps = RouteComponentProps<{ group: string }>;

const UserPreferencePage: React.FC<UserPreferencePageProps> = ({ match }) => {
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
  const {
    params: { group: groupIdFromUrl },
  } = match;
  const initialTabId =
    sortedUserPreferenceGroups.find((extension) => extension.id === groupIdFromUrl)?.id ||
    sortedUserPreferenceGroups[0]?.id;
  const [activeTabId, setActiveTabId] = React.useState<string>(initialTabId);

  const [userPreferenceTabs, userPreferenceTabContents] = React.useMemo<
    [React.ReactElement<TabProps>[], React.ReactElement<TabContentProps>[]]
  >(() => {
    const populatedUserPreferenceGroups: UserPreferenceTabGroup[] = getUserPreferenceGroups(
      sortedUserPreferenceGroups,
      sortedUserPreferenceItems,
    );
    const [tabs, tabContents] = populatedUserPreferenceGroups.reduce(
      (acc, currGroup) => {
        const { id, label, items } = currGroup;
        const ref = React.createRef<HTMLElement>();
        acc[0].push(
          <Tab
            key={id}
            eventKey={id}
            title={<TabTitleText>{label}</TabTitleText>}
            href={`${USER_PREFERENCES_BASE_URL}/${id}`}
            tabContentId={id}
            tabContentRef={ref}
            data-test={`tab ${id}`}
            translate="no"
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

  // utils and callbacks
  const handleTabClick = (event: React.MouseEvent<HTMLElement>, eventKey: string) => {
    if (isModifiedEvent(event)) {
      return;
    }
    event.preventDefault();
    setActiveTabId(eventKey);
    history.replace(`${USER_PREFERENCES_BASE_URL}/${eventKey}`);
  };

  return (
    <div className="co-user-preference-page">
      <Helmet>
        <title>{t('console-app~User Preferences')}</title>
      </Helmet>
      <PageLayout
        title={t('console-app~User Preferences')}
        hint={t(
          'Set your individual preferences for the console experience. Any changes will be autosaved.',
        )}
      >
        {userPreferenceItemResolved ? (
          <div className="co-user-preference-page-content">
            <div className="co-user-preference-page-content__tabs">
              <Tabs
                activeKey={activeTabId}
                onSelect={handleTabClick}
                isVertical
                variant="light300"
                data-test="user-preferences tabs"
              >
                {userPreferenceTabs}
              </Tabs>
            </div>
            <div className="co-user-preference-page-content__tab-content">
              {userPreferenceTabContents}
            </div>
          </div>
        ) : (
          <LoadingBox />
        )}
      </PageLayout>
    </div>
  );
};

export default UserPreferencePage;
