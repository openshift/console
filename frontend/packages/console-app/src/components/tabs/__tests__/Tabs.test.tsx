import * as React from 'react';
import { Tab, Tabs, TabTitleIcon, TabTitleText } from '@patternfly/react-core';
import { render } from 'enzyme';

test('should render simple tabs', () => {
  const view = render(
    <Tabs id="simpleTabs">
      <Tab
        translate="no"
        id="tab1"
        eventKey={0}
        title={<TabTitleText>{'Tab item 1'}</TabTitleText>}
      >
        Tab 1 section
      </Tab>
      <Tab
        translate="no"
        id="tab2"
        eventKey={1}
        title={<TabTitleText>{'Tab item 2'}</TabTitleText>}
      >
        Tab 2 section
      </Tab>
      <Tab
        translate="no"
        id="tab3"
        eventKey={2}
        title={<TabTitleText>{'Tab item 3'}</TabTitleText>}
      >
        Tab 3 section
      </Tab>
      <Tab
        translate="no"
        id="tab4"
        eventKey={3}
        title={
          <>
            <TabTitleIcon>
              <i>4</i>
            </TabTitleIcon>{' '}
            <TabTitleText>Users</TabTitleText>{' '}
          </>
        }
      >
        Tab 4 section
      </Tab>
    </Tabs>,
  );
  expect(view).toMatchSnapshot();
});

test('should render uncontrolled tabs', () => {
  const view = render(
    <Tabs defaultActiveKey={0}>
      <Tab
        translate="no"
        id="tab1"
        eventKey={0}
        title={<TabTitleText>{'Tab item 1'}</TabTitleText>}
      >
        Tab 1 section
      </Tab>
      <Tab
        translate="no"
        id="tab2"
        eventKey={1}
        title={<TabTitleText>{'Tab item 2'}</TabTitleText>}
      >
        Tab 2 section
      </Tab>
      <Tab
        translate="no"
        id="tab3"
        eventKey={2}
        title={<TabTitleText>{'Tab item 3'}</TabTitleText>}
      >
        Tab 3 section
      </Tab>
      <Tab
        translate="no"
        id="tab4"
        eventKey={3}
        title={
          <>
            <TabTitleIcon>
              <i>4</i>
            </TabTitleIcon>{' '}
            <TabTitleText>Users</TabTitleText>{' '}
          </>
        }
      >
        Tab 4 section
      </Tab>
    </Tabs>,
  );
  expect(view).toMatchSnapshot();
});

test('should render vertical tabs', () => {
  const view = render(
    <Tabs id="verticalTabs" isVertical>
      <Tab
        translate="no"
        id="tab1"
        eventKey={0}
        title={<TabTitleText>{'Tab item 1'}</TabTitleText>}
      >
        Tab 1 section
      </Tab>
      <Tab
        translate="no"
        id="tab2"
        eventKey={1}
        title={<TabTitleText>{'Tab item 2'}</TabTitleText>}
      >
        Tab 2 section
      </Tab>
      <Tab
        translate="no"
        id="tab3"
        eventKey={2}
        title={<TabTitleText>{'Tab item 3'}</TabTitleText>}
      >
        Tab 3 section
      </Tab>
      <Tab
        translate="no"
        id="tab4"
        eventKey={3}
        title={
          <>
            <TabTitleIcon>
              <i>4</i>
            </TabTitleIcon>{' '}
            <TabTitleText>Users</TabTitleText>{' '}
          </>
        }
      >
        Tab 4 section
      </Tab>
    </Tabs>,
  );
  expect(view).toMatchSnapshot();
});

test('should render expandable vertical tabs', () => {
  const view = render(
    <Tabs id="verticalTabs" isVertical toggleText="toggle" expandable={{ default: 'expandable' }}>
      <Tab
        translate="no"
        id="tab1"
        eventKey={0}
        title={<TabTitleText>{'Tab item 1'}</TabTitleText>}
      >
        Tab 1 section
      </Tab>
      <Tab
        translate="no"
        id="tab2"
        eventKey={1}
        title={<TabTitleText>{'Tab item 2'}</TabTitleText>}
      >
        Tab 2 section
      </Tab>
      <Tab
        translate="no"
        id="tab3"
        eventKey={2}
        title={<TabTitleText>{'Tab item 3'}</TabTitleText>}
      >
        Tab 3 section
      </Tab>
      <Tab
        translate="no"
        id="tab4"
        eventKey={3}
        title={
          <>
            <TabTitleIcon>
              <i>4</i>
            </TabTitleIcon>{' '}
            <TabTitleText>Users</TabTitleText>{' '}
          </>
        }
      >
        Tab 4 section
      </Tab>
    </Tabs>,
  );
  expect(view).toMatchSnapshot();
});
