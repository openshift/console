import * as React from 'react';
import {
  Tabs,
  Tab,
  TabProps,
  TabTitleText,
  TabContent,
  TabContentProps,
  Form,
} from '@patternfly/react-core';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import {
  useResolvedExtensions,
  UserSettings,
  isUserSettings,
  UserSettingsGroup,
  isUserSettingsGroup,
} from '@console/dynamic-plugin-sdk';
import { LoadingBox, PageHeading, history } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk/src';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';
import './UserPreferences.scss';
import { UserSettingsTabGroup, ResolvedUserSettings, ResolvedUserSettingsGroup } from './types';
import { getTabContents } from './utils/getTabContents';
import { getUserSettingsGroups } from './utils/getUserSettingsGroups';

export type UserPreferencesProps = RouteComponentProps<{ category: string }>;

const UserPreferences: React.FC<UserPreferencesProps> = ({ match }) => {
  // resources and calls to hooks
  const { t } = useTranslation();

  const [userSettingsExtensions, userSettingsResolved] = useResolvedExtensions<UserSettings>(
    isUserSettings,
  );
  const sortedUserSettingsExtensions = orderExtensionBasedOnInsertBeforeAndAfter<
    ResolvedUserSettings
  >(userSettingsExtensions.map(({ properties }) => properties));

  const userSettingsGroupExtensions = useExtensions<UserSettingsGroup>(isUserSettingsGroup);
  const sortedUserSettingsGroupExtensions = orderExtensionBasedOnInsertBeforeAndAfter<
    ResolvedUserSettingsGroup
  >(userSettingsGroupExtensions.map(({ properties }) => properties));

  // fetch the default category from the url params if available
  const {
    url,
    params: { category: groupIdFromUrl },
  } = match;
  const { id: initialTabId } =
    sortedUserSettingsGroupExtensions.length > 0
      ? sortedUserSettingsGroupExtensions.find((extension) => extension.id === groupIdFromUrl) ||
        sortedUserSettingsGroupExtensions[0]
      : { id: '' };
  const [activeTabId, setActiveTabId] = React.useState<string>(initialTabId);

  // utils and callbacks
  const getTabs = (): [React.ReactElement<TabProps>[], React.ReactElement<TabContentProps>[]] => {
    const userSettingsGroup: UserSettingsTabGroup[] = getUserSettingsGroups(
      sortedUserSettingsExtensions,
      sortedUserSettingsGroupExtensions,
    );
    const [tabs, tabContents] = userSettingsGroup.reduce(
      (acc, currGroup) => {
        const { id, label, items } = currGroup;
        const ref = React.createRef<HTMLElement>();
        acc[0].push(
          <Tab
            key={id}
            eventKey={id}
            title={<TabTitleText>{label}</TabTitleText>}
            tabContentId={id}
            tabContentRef={ref}
            data-test={`userPreferenceTab ${id}`}
          />,
        );
        acc[1].push(
          <TabContent
            key={id}
            eventKey={id}
            id={id}
            ref={ref}
            hidden={id !== activeTabId}
            data-test={`userPreferenceTabContent ${id}`}
          >
            <Form>{getTabContents(items)}</Form>
          </TabContent>,
        );
        return acc;
      },
      [[], []],
    );
    return [tabs, tabContents];
  };
  const handleTabClick = (event, eventKey) => {
    setActiveTabId(eventKey);
    history.replace(`${url}/${eventKey}`);
  };

  // render elements
  const [userSettingsTabs, userSettingsTabContents] = getTabs();

  return (
    <>
      <Helmet>
        <title>{t('console-app~User Settings')}</title>
      </Helmet>
      <PageHeading detail title={t('console-app~User Settings')} />
      <div className="ocs-user-preferences-container">
        {userSettingsResolved ? (
          <div className="ocs-user-preferences-content">
            <div id="tabs-section" className="ocs-user-preferences-content__tabs">
              <Tabs
                activeKey={activeTabId}
                onSelect={handleTabClick}
                isVertical
                variant="light300"
                data-test="userPreferenceTabs container"
              >
                {userSettingsTabs}
              </Tabs>
            </div>
            <div id="tab-content-section" className="ocs-user-preferences-content__tab-content">
              {userSettingsTabContents}
            </div>
          </div>
        ) : (
          <LoadingBox />
        )}
      </div>
    </>
  );
};

export default UserPreferences;
