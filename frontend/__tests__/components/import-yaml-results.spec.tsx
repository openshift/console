import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Spinner } from '@patternfly/react-core';
import { Tr } from '@patternfly/react-table';
import { RedExclamationCircleIcon } from '@console/shared';
import {
  ImportYAMLResults,
  ImportYAMLPageStatus,
  ImportYAMLResourceStatus,
} from '../../public/components/import-yaml-results';

describe('ImportYAMLResults: test component layout', () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(
      <ImportYAMLResults
        createResources={() => {
          return {};
        }}
        displayResults={() => {
          return;
        }}
        importResources={[]}
        retryFailed={() => {
          return;
        }}
      />,
    );
  });

  it('should render ImportYamlPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correct Import YAML Results title', () => {
    const helmet = wrapper.childAt(0);
    expect(helmet.contains('Import YAML Results')).toBeTruthy();
  });

  it('should render Import YAML page status component with props', () => {
    expect(wrapper.contains(<ImportYAMLPageStatus inFlight={true} errors={false} />)).toBeTruthy();
  });

  it('renders column for name', () => {
    const col = wrapper.find(Tr).childAt(0);
    expect(col.text()).toBe('Name');
  });

  it('renders column for namespace', () => {
    const col = wrapper.find(Tr).childAt(1);
    expect(col.text()).toBe('Namespace');
  });

  it('renders column for creation status', () => {
    const col = wrapper.find(Tr).childAt(2);
    expect(col.text()).toBe('Creation status');
  });
});

describe('ImportYAMLPageStatus: test first render where inFlight is always true', () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(<ImportYAMLPageStatus inFlight={true} />);
  });

  it('should render ImportYAMLPageStatus component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render a spinner', () => {
    expect(wrapper.find(Spinner).exists()).toBe(true);
  });

  it('should render correct Creating resources... header text', () => {
    const header = wrapper.childAt(1);
    expect(header.contains('Creating resources...')).toBeTruthy();
  });
});

describe('ImportYAMLPageStatus: test prop inFlight is false', () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(<ImportYAMLPageStatus inFlight={false} />);
  });

  it('should not render a spinner', () => {
    expect(wrapper.find(Spinner).exists()).toBe(false);
  });

  it('should render correct Resources successfully created header text', () => {
    const header = wrapper.childAt(1);
    expect(header.contains('Resources successfully created')).toBeTruthy();
  });
});

describe('ImportYAMLPageStatus: test component when errors exist and inFlight set to false', () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(<ImportYAMLPageStatus inFlight={false} errors={true} />);
  });

  it('should not render a spinner', () => {
    expect(wrapper.find(Spinner).exists()).toBe(false);
  });

  it('should render failure message in header text', () => {
    const header = wrapper.childAt(1);
    expect(header.contains('One or more resources failed to be created')).toBeTruthy();
  });
});

describe('ImportYAMLResourceStatus: test initial render when creating is true', () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(<ImportYAMLResourceStatus creating={true} message="Creating" />);
  });

  it('should render ImportYAMLResourceStatus component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render a spinner', () => {
    const firstDiv = wrapper.childAt(0);
    expect(firstDiv.find(Spinner).exists()).toBe(true);
  });

  it('should render Creating status message', () => {
    const span = wrapper.childAt(1);
    expect(span.contains('Creating')).toBeTruthy();
  });
});

describe('ImportYAMLResourceStatus: test props creating is false', () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(<ImportYAMLResourceStatus creating={false} message="Created" />);
  });

  it('should no longer render a spinner component', () => {
    const span = wrapper.childAt(0);
    expect(span.find(Spinner).exists()).toBe(false);
  });

  it('should render correct Created status message', () => {
    const span = wrapper.childAt(1);
    expect(span.contains('Created')).toBeTruthy();
  });
});

describe('ImportYAMLResourceStatus: test when errors exist after creating', () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(
      <ImportYAMLResourceStatus creating={false} error={true} message="Error creating resource" />,
    );
  });

  it('should not render a spinner component', () => {
    const span = wrapper.childAt(0);
    expect(span.find(Spinner).exists()).toBe(false);
  });

  it('should render a red exclamation component', () => {
    const span = wrapper.childAt(0);
    expect(span.find(RedExclamationCircleIcon).exists()).toBe(true);
  });

  it('should render provided error message status', () => {
    const span = wrapper.childAt(1);
    expect(span.contains('Error creating resource')).toBeTruthy();
  });
});
