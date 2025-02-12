import * as React from 'react';
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
};

export const SimpleTabNav: React.FC<SimpleTabNavProps> = ({
  onClickTab,
  selectedTab,
  tabProps = null,
  tabs,
  additionalClassNames,
}) => {
  const handleTabClick = (_e, tabIndex: string) => {
    onClickTab && onClickTab(tabIndex);
  };

  return (
    <Tabs
      onSelect={handleTabClick}
      className={additionalClassNames}
      defaultActiveKey={selectedTab || tabs[0]?.name}
      inset={{ default: 'insetNone', xl: 'insetSm' }}
    >
      {tabs.map((tab) => {
        const content =
          !React.isValidElement(tab.component) && !Array.isArray(tab.component)
            ? React.createElement(tab.component as React.FunctionComponent, tabProps)
            : tab.component;

        return (
          <PfTab key={tab.name} eventKey={tab.name} title={<TabTitleText>{tab.name}</TabTitleText>} data-test={`horizonta-link-${tab.name}`}>
            {content}
          </PfTab>
        );
      })}
    </Tabs>
  );
};
