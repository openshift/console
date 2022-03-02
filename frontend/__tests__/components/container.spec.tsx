import {
  ContainersDetailsPage,
  ContainerDetails,
  ContainerDetailsList,
} from '../../public/components/container';
import { mount, ReactWrapper, shallow } from 'enzyme';
import * as React from 'react';
import store from '@console/internal/redux';
import { Provider } from 'react-redux';
import {
  Firehose,
  HorizontalNav,
  LoadingBox,
  PageHeading,
  PageHeadingProps,
} from '@console/internal/components/utils';
import { testPodInstance } from '../../__mocks__/k8sResourcesMocks';
import { Status } from '@console/shared';
import { ErrorPage404 } from '@console/internal/components/error';
import { StatusProps } from '@console/metal3-plugin/src/components/types';
import { Router } from 'react-router';
import { history } from '@console/internal/components/utils/router';
import { act } from 'react-dom/test-utils';

describe(ContainersDetailsPage.displayName, () => {
  let containerDetailsPage: ReactWrapper;

  beforeEach(() => {
    const match = {
      params: { podName: 'test-name', ns: 'default' },
      isExact: true,
      path: '',
      url: '',
    };

    containerDetailsPage = mount(<ContainersDetailsPage match={match} />, {
      wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  });

  it('renders a `Firehose` using the given props', () => {
    const firehoseResources = containerDetailsPage.find<any>(Firehose).props().resources[0];
    expect(firehoseResources).toEqual({
      name: 'test-name',
      namespace: 'default',
      kind: 'Pod',
      isList: false,
      prop: 'obj',
    });
  });
});

describe(ContainerDetails.displayName, () => {
  const obj = { data: { ...testPodInstance } };
  const matchWithExistingContainer = {
    params: { podName: 'test-name', ns: 'default', name: 'crash-app' },
    isExact: true,
    path: '',
    url: '',
  };

  it('renders a `PageHeading` and a `ContainerDetails` with the same state', async () => {
    // Full mount needed to get the children of the PageHeading within the ContainerDetails without warning
    let containerDetails: ReactWrapper;
    await act(async () => {
      containerDetails = mount(
        <ContainerDetails match={matchWithExistingContainer} obj={obj} loaded={true} />,
        {
          wrappingComponent: ({ children }) => (
            <Router history={history}>
              <Provider store={store}>{children}</Provider>
            </Router>
          ),
        },
      );
    });

    const pageHeadingStatusProps = containerDetails
      .find<PageHeadingProps>(PageHeading)
      .children()
      .find<StatusProps>(Status)
      .props();

    const containerDetailsList = shallow(
      containerDetails
        .find<any>(HorizontalNav)
        .props()
        .pages[0].component({ match: matchWithExistingContainer, obj: testPodInstance }),
    );

    const containerDetailsStatusProps = containerDetailsList.find<StatusProps>(Status).props();

    expect(pageHeadingStatusProps.status).toEqual('Waiting');
    expect(containerDetailsStatusProps.status).toEqual('Waiting');
  });

  it("renders a `ErrorPage404` if the container to render doesn't exist", () => {
    const matchWithNonExistingContainer = {
      params: { podName: 'test-name', ns: 'default', name: 'non-existing-container' },
      isExact: true,
      path: '',
      url: '',
    };

    const containerDetails = shallow(
      <ContainerDetails match={matchWithNonExistingContainer} obj={obj} loaded={true} />,
    );

    expect(containerDetails.containsMatchingElement(<ErrorPage404 />)).toBe(true);
  });

  it("renders a `LoadingBox` if props aren't loaded yet", () => {
    const containerDetails = shallow(
      <ContainerDetails match={matchWithExistingContainer} obj={obj} loaded={false} />,
    );

    expect(containerDetails.containsMatchingElement(<LoadingBox />)).toBe(true);
  });
});

describe(ContainerDetailsList.displayName, () => {
  it("renders a `ErrorPage404` if the container to render doesn't exist", () => {
    const matchWithNonExistingContainer = {
      params: { podName: 'test-name', ns: 'default', name: 'non-existing-container' },
      isExact: true,
      path: '',
      url: '',
    };

    const containerDetailsList = shallow(
      <ContainerDetailsList match={matchWithNonExistingContainer} obj={testPodInstance} />,
    );

    expect(containerDetailsList.containsMatchingElement(<ErrorPage404 />)).toBe(true);
  });
});
