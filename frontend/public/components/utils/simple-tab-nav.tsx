import * as React from 'react';
import classnames from 'classnames';
import { Tabs, Tab as PfTab, TabTitleText } from '@patternfly/react-core';

export type Tab = {
  name: string;
  component: React.FunctionComponent<{}> | React.ReactElement;
};

type SimpleTabNavProps = {
  onClickTab?: (name: string) => void;
  /** The default tab to be selected. Note that SimpleTabNav manages its own current tab state. */
  selectedTab?: string;
  tabProps?: any;
  tabs: Tab[];
  additionalClassNames?: string;
  /** Cancels out padding within a sidebar and adds extra margin to the bottom of the tab list */
  withinSidebar?: boolean;
};

export const SimpleTabNav: React.FC<SimpleTabNavProps> = ({
  onClickTab,
  selectedTab,
  tabProps = null,
  tabs,
  additionalClassNames,
  withinSidebar,
}) => {
  const handleTabClick = (_e, tabIndex: string) => {
    onClickTab && onClickTab(tabIndex);
  };

  // the div wrapper prevents the tabs from collapsing in a flexbox
  return (
    <div>
      <Tabs
        onSelect={handleTabClick}
        className={classnames(
          { 'pf-v6-u-mb-lg co-m-pane__body--offset-padding': withinSidebar },
          additionalClassNames,
        )}
        defaultActiveKey={selectedTab || tabs[0]?.name}
        inset={{ default: 'insetNone', xl: 'insetSm' }}
        unmountOnExit
      >
        {tabs.map((tab) => {
          const content =
            !React.isValidElement(tab.component) && !Array.isArray(tab.component)
              ? React.createElement(tab.component as React.FunctionComponent, tabProps)
              : tab.component;

          return (
            <PfTab
              key={tab.name}
              eventKey={tab.name}
              title={<TabTitleText>{tab.name}</TabTitleText>}
              data-test={`horizontal-link-${tab.name}`}
            >
              {content}
            </PfTab>
          );
        })}
      </Tabs>
    </div>
  );
};
