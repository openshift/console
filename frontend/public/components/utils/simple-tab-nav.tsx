import type { FunctionComponent, ReactElement, FC } from 'react';
import { isValidElement, createElement } from 'react';
import { css } from '@patternfly/react-styles';
import { Tabs, Tab as PfTab, TabTitleText } from '@patternfly/react-core';

export type Tab = {
  name: string;
  component: FunctionComponent<{}> | ReactElement;
};

type SimpleTabNavProps = {
  onClickTab?: (name: string) => void;
  /** The default tab to be selected. Note that SimpleTabNav manages its own current tab state. */
  selectedTab?: string;
  tabProps?: any;
  tabs: Tab[];
  additionalClassNames?: string;
  /** Removes inset and adds extra margin to the bottom of the tab list */
  withinSidebar?: boolean;
  noInset?: boolean;
};

export const SimpleTabNav: FC<SimpleTabNavProps> = ({
  onClickTab,
  selectedTab,
  tabProps = null,
  tabs,
  additionalClassNames,
  withinSidebar,
  noInset,
}) => {
  const handleTabClick = (_e, tabIndex: string) => {
    onClickTab && onClickTab(tabIndex);
  };

  // the div wrapper prevents the tabs from collapsing in a flexbox
  return (
    <div>
      <Tabs
        onSelect={handleTabClick}
        className={css({ 'pf-v6-u-mb-md': withinSidebar }, additionalClassNames)}
        defaultActiveKey={selectedTab || tabs[0]?.name}
        inset={!noInset && { default: 'insetSm' }}
        unmountOnExit
      >
        {tabs.map((tab) => {
          const content =
            !isValidElement(tab.component) && !Array.isArray(tab.component)
              ? createElement(tab.component as FunctionComponent, tabProps)
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
