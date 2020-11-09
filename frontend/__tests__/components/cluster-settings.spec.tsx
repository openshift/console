import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow, mount, ShallowWrapper } from 'enzyme';

import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  clusterVersionProps,
  clusterVersionUpdatingProps,
  clusterVersionUpdatedProps,
  machineConfigPoolsProps,
  workerMachineConfigPoolProp,
} from '../../__mocks__/clusterVersionMock';

import {
  ChannelName,
  ChannelVersion,
  ClusterOperatorTabPage,
  ClusterSettingsPage,
  ClusterVersionDetailsTable,
  CurrentChannel,
  CurrentVersion,
  CurrentVersionHeader,
  NodesUpdatesGroup,
  UpdateInProgress,
  UpdateLink,
  UpdatesGraph,
  UpdatesProgress,
  UpdateStatus,
  UpdatingMessageText,
} from '../../public/components/cluster-settings/cluster-settings';
import { GlobalConfigPage } from '../../public/components/cluster-settings/global-config';
import { Firehose, HorizontalNav, ResourceLink, Timestamp } from '../../public/components/utils';
import { AddCircleOIcon } from '@patternfly/react-icons';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const i18nNS = 'cluster-settings';

describe('Cluster Settings page', () => {
  let wrapper: ShallowWrapper<any>;
  const match = { url: '/settings/cluster', params: {}, isExact: true, path: '/settings/cluster' };

  beforeEach(() => {
    wrapper = shallow(<ClusterSettingsPage match={match} />);
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
  });

  it('should render ClusterSettingsPage component', () => {
    expect(wrapper.exists()).toBe(true);
  });
  it('should render correct Cluster Settings page title', () => {
    expect(wrapper.contains(`${i18nNS}~Cluster Settings`)).toBeTruthy();
  });
  it('should render the Firehose Component with the props', () => {
    expect(wrapper.find(Firehose).exists()).toBe(true);
    expect(
      wrapper
        .find(Firehose)
        .at(0)
        .props().resources.length,
    ).toBe(2);
    expect(
      wrapper
        .find(Firehose)
        .at(0)
        .props().resources[0].kind,
    ).toBe('config.openshift.io~v1~ClusterVersion');
    expect(
      wrapper
        .find(Firehose)
        .at(0)
        .props().resources[1].kind,
    ).toBe('autoscaling.openshift.io~v1~ClusterAutoscaler');
    expect(
      wrapper
        .find(Firehose)
        .at(0)
        .props().resources[0].name,
    ).toBe('version');
    expect(
      wrapper
        .find(Firehose)
        .at(0)
        .props().resources[0].isList,
    ).toBe(false);
    expect(
      wrapper
        .find(Firehose)
        .at(0)
        .props().resources[1].isList,
    ).toBe(true);
  });
  it('should render the HorizontalNav Component with the props', () => {
    expect(wrapper.find(HorizontalNav).exists()).toBe(true);
    expect(
      wrapper
        .find(HorizontalNav)
        .at(0)
        .props().pages.length,
    ).toBe(3);
    expect(
      wrapper
        .find(HorizontalNav)
        .at(0)
        .props().pages[0].name,
    ).toBe(`${i18nNS}~Details`);
    expect(
      wrapper
        .find(HorizontalNav)
        .at(0)
        .props().pages[1].name,
    ).toBe('ClusterOperators');
    expect(
      wrapper
        .find(HorizontalNav)
        .at(0)
        .props().pages[2].name,
    ).toBe(`${i18nNS}~Global configuration`);
    expect(
      wrapper
        .find(HorizontalNav)
        .at(0)
        .props().pages[0].component,
    ).toEqual(ClusterVersionDetailsTable);
    expect(
      wrapper
        .find(HorizontalNav)
        .at(0)
        .props().pages[1].component,
    ).toEqual(ClusterOperatorTabPage);
    expect(
      wrapper
        .find(HorizontalNav)
        .at(0)
        .props().pages[2].component,
    ).toEqual(GlobalConfigPage);
  });
});

describe('Cluster Version Details Table page', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionProps;
    wrapper = shallow(<ClusterVersionDetailsTable obj={cv} autoscalers={[]} />);
  });

  it('should render ClusterVersionDetailsTable component', () => {
    expect(wrapper.exists()).toBe(true);
  });
  it('should render the child components of ClusterVersionDetailsTable component', () => {
    expect(wrapper.find(CurrentVersionHeader).exists()).toBe(true);
    expect(wrapper.find(CurrentVersion).exists()).toBe(true);
    expect(wrapper.find(UpdateStatus).exists()).toBe(true);
    expect(wrapper.find(CurrentChannel).exists()).toBe(true);
    expect(wrapper.find(UpdateLink).exists()).toBe(true);
    expect(wrapper.find(UpdatesGraph).exists()).toBe(true);
    expect(wrapper.find(UpdateInProgress).exists()).toBe(false);
    expect(wrapper.find(ResourceLink).exists()).toBe(true);
    expect(wrapper.find(AddCircleOIcon).exists()).toBe(true);
    expect(wrapper.find(Timestamp).exists()).toBe(true);
  });
  it('should render correct values of ClusterVersionDetailsTable component', () => {
    expect(
      wrapper
        .find(CurrentChannel)
        .at(0)
        .props().cv.spec.channel,
    ).toEqual('stable-4.5');
    expect(
      wrapper
        .find(CurrentVersion)
        .at(0)
        .props().cv.status.desired.version,
    ).toEqual('4.5.2');
    expect(wrapper.find('[data-test-id="cv-details-table-cid"]').text()).toEqual(
      '727841c6-242d-4592-90d1-699925c4cfba',
    );
    expect(wrapper.find('[data-test-id="cv-details-table-image"]').text()).toEqual(
      'registry.svc.ci.openshift.org/ocp/release@sha256:8f923b7b8efdeac619eb0e7697106c1d17dd3d262c49d8742b38600417cf7d1d',
    );
    expect(wrapper.find('[data-test-id="cv-details-table-version"]').text()).toEqual('4.5.2');
    expect(wrapper.find('[data-test-id="cv-details-table-state"]').text()).toEqual('Completed');
    expect(
      wrapper
        .find(ResourceLink)
        .at(0)
        .props().name,
    ).toEqual('version');
    expect(
      wrapper
        .find(Link)
        .childAt(1)
        .text(),
    ).toEqual(`${i18nNS}~Create autoscaler`);
    expect(
      wrapper
        .find(ResourceLink)
        .at(0)
        .props().name,
    ).toEqual('version');
    expect(
      wrapper
        .find(Link)
        .childAt(1)
        .text(),
    ).toEqual(`${i18nNS}~Create autoscaler`);
    expect(
      wrapper
        .find(Timestamp)
        .at(0)
        .props().timestamp,
    ).toEqual('2020-08-05T17:21:48Z');
    expect(
      wrapper
        .find(Timestamp)
        .at(1)
        .props().timestamp,
    ).toEqual('2020-08-05T17:49:47Z');
  });
});

describe('Current Version Header', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionProps;
    wrapper = shallow(<CurrentVersionHeader cv={cv} />);
  });

  it('should render the Current Version heading', () => {
    expect(wrapper.text()).toBe(`${i18nNS}~Current version`);
  });
});

describe('Current Version', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionProps;
    wrapper = shallow(<CurrentVersion cv={cv} />);
  });

  it('should render the Current Version value', () => {
    expect(wrapper.find('[data-test-id="cluster-version"]').text()).toBe('4.5.2');
  });
});

describe('Update Status', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionProps;
    wrapper = shallow(<UpdateStatus cv={cv} />);
  });

  it('should render the Update Status value', () => {
    expect(wrapper.render().text()).toBe(` ${i18nNS}~Available updates`);
  });
});

describe('Current Channel', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<CurrentChannel cv={clusterVersionProps} clusterVersionIsEditable={true} />);
  });

  it('should accept props', () => {
    expect(wrapper.props().cv).toEqual(clusterVersionProps);
  });
  it('should render the value of channel', () => {
    expect(wrapper.text()).toBe('stable-4.5');
  });
});

describe('Update Link', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionProps;
    wrapper = shallow(<UpdateLink cv={cv} clusterVersionIsEditable={true} />);
  });

  it('should render Update Link component', () => {
    expect(wrapper.exists()).toBe(true);
    expect(
      wrapper
        .find('[data-test-id="cv-update-button"]')
        .render()
        .text(),
    ).toBe('public~Update');
  });
});

describe('Updates Graph', () => {
  let wrapper;
  let cv;

  beforeEach(() => {
    cv = clusterVersionProps;
    wrapper = mount(<UpdatesGraph cv={cv} />);
  });

  it('should accept props', () => {
    expect(wrapper.props().cv).toEqual(cv);
  });
  it('should render the value of current channel', () => {
    expect(
      wrapper
        .find(ChannelName)
        .at(0)
        .text(),
    ).toBe(`${i18nNS}~{{currentChannel}} channel`);
  });
  it('should render the value of current version', () => {
    expect(
      wrapper
        .find(ChannelVersion)
        .at(0)
        .text(),
    ).toBe('4.5.2');
  });
  it('should render the value of next available version', () => {
    expect(
      wrapper
        .find(ChannelVersion)
        .at(1)
        .text(),
    ).toBe('4.5.4');
  });
  it('should render the value of available channel', () => {
    expect(
      wrapper
        .find(ChannelName)
        .at(1)
        .text(),
    ).toBe('cluster-settings~{{newerChannel}} channel');
  });
});

describe('Cluster Version Details Table page while updating', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionUpdatingProps;
    wrapper = shallow(<ClusterVersionDetailsTable obj={cv} autoscalers={[]} />);
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
  });

  it('should render ClusterVersionDetailsTable component', () => {
    expect(wrapper.exists()).toBe(true);
  });
  it('should render the child components of ClusterVersionDetailsTable component', () => {
    expect(wrapper.find(CurrentVersionHeader).exists()).toBe(true);
    expect(wrapper.find(CurrentVersion).exists()).toBe(true);
    expect(wrapper.find(UpdateStatus).exists()).toBe(true);
    expect(wrapper.find(CurrentChannel).exists()).toBe(true);
    expect(wrapper.find(UpdateLink).exists()).toBe(true);
    expect(wrapper.find(UpdatesGraph).exists()).toBe(false);
    expect(wrapper.find(UpdateInProgress).exists()).toBe(true);
  });
});

describe('Current Version Header while updating', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionUpdatingProps;
    wrapper = shallow(<CurrentVersionHeader cv={cv} />);
  });

  it('should render the Current Version heading', () => {
    expect(wrapper.text()).toBe(`${i18nNS}~Last completed version`);
  });
});

describe('Update Status while updating', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionUpdatingProps;
    wrapper = shallow(<UpdatingMessageText cv={cv} />);
  });

  it('should render the Updating Message Text value', () => {
    expect(wrapper.text()).toBe(`${i18nNS}~Update to {{version}} in progress`);
  });
});

describe('Update In Progress while updating', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionUpdatingProps;
    wrapper = shallow(
      <UpdateInProgress
        desiredVersion={cv.spec.desiredUpdate.version}
        machineConfigPools={machineConfigPoolsProps.items}
        workerMachineConfigPool={workerMachineConfigPoolProp}
        updateStartedTime="2020-08-05T21:09:02Z"
      />,
    );
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
  });

  it('should render the child components of UpdateInProgress component', () => {
    expect(wrapper.find(UpdatesProgress)).toHaveLength(1);
    expect(
      wrapper
        .find(Link)
        .at(0)
        .text(),
    ).toBe('ClusterOperators');
    expect(
      wrapper
        .find(NodesUpdatesGroup)
        .at(0)
        .props().name,
    ).toBe('Master');
    expect(
      wrapper
        .find(NodesUpdatesGroup)
        .at(1)
        .props().name,
    ).toBe('Worker');
  });
});

describe('Cluster Version Details Table page once updated', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionUpdatedProps;
    wrapper = shallow(<ClusterVersionDetailsTable obj={cv} autoscalers={[]} />);
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
  });

  it('should render ClusterVersionDetailsTable component', () => {
    expect(wrapper.exists()).toBe(true);
  });
  it('should render the child components of ClusterVersionDetailsTable component', () => {
    expect(wrapper.find(CurrentVersionHeader).exists()).toBe(true);
    expect(wrapper.find(CurrentVersion).exists()).toBe(true);
    expect(wrapper.find(UpdateStatus).exists()).toBe(true);
    expect(wrapper.find(CurrentChannel).exists()).toBe(true);
    expect(wrapper.find(UpdateLink).exists()).toBe(true);
    expect(wrapper.find(UpdatesGraph).exists()).toBe(true);
    expect(wrapper.find(UpdateInProgress).exists()).toBe(false);
  });
});

describe('Update Link once updated', () => {
  let wrapper: ShallowWrapper<any>;
  let cv;

  beforeEach(() => {
    cv = clusterVersionUpdatedProps;
    wrapper = shallow(<UpdateLink cv={cv} clusterVersionIsEditable={true} />);
  });

  it('should render an empty Update Link component', () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.isEmptyRender()).toBe(true);
  });
});
