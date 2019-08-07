import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow, mount } from 'enzyme';

import { clusterVersionProps } from '../../__mocks__/clusterVersinMock';
import {
    ClusterSettingsPage,
    ClusterVersionDetailsTable,
    CurrentChannel,
    CurrentVersionHeader,
    CurrentVersion,
    UpdateLink,
    UpdateStatus,
    ClusterOperatorTabPage
} from '../../public/components/cluster-settings/cluster-settings';
import {GlobalConfigPage, } from '../../public/components/cluster-settings/global-config';
import {
    ClusterVersionKind,
    getClusterUpdateStatus
} from '../../public/module/k8s';
import {
    Firehose,
    HorizontalNav,
    ResourceLink,
    Timestamp,
} from '../../public/components/utils';
import {
    AddCircleOIcon,
} from '@patternfly/react-icons';
import * as dependency from '../../public/components/modals';



describe('Cluster Settings page', () => {
    let wrapper;
    const match = { url: '', params: { ns: 'default', plural: 'pods' }, isExact: true, path: '' };

    beforeEach(() => {
        wrapper = shallow(<ClusterSettingsPage match={match} />);
    });


    it('should render ClusterSettingsPage component', () => {
        expect(wrapper.exists()).toBe(true);
    });
    it('should render correct Cluster Settings page title', () => {
        expect(wrapper.contains('Cluster Settings')).toBeTruthy();
    });
    it('should render the Firehose Component with the props', () => {
       expect(wrapper.find(Firehose).exists()).toBe(true);
       expect(wrapper.find(Firehose).at(0).props().resources.length).toBe(2);
       expect(wrapper.find(Firehose).at(0).props().resources[0].kind).toBe('config.openshift.io~v1~ClusterVersion');
       expect(wrapper.find(Firehose).at(0).props().resources[1].kind).toBe('autoscaling.openshift.io~v1~ClusterAutoscaler');
       expect(wrapper.find(Firehose).at(0).props().resources[0].name).toBe('version');
       expect(wrapper.find(Firehose).at(0).props().resources[0].isList).toBe(false);
       expect(wrapper.find(Firehose).at(0).props().resources[1].isList).toBe(true);
    });
    it('should render the HorizontalNav Component with the props', () => {
       expect(wrapper.find(HorizontalNav).exists()).toBe(true);
       expect(wrapper.find(HorizontalNav).at(0).props().pages.length).toBe(3);
       expect(wrapper.find(HorizontalNav).at(0).props().hideDivider).toBe(true);
       expect(wrapper.find(HorizontalNav).at(0).props().pages[0].name).toBe('Overview');
       expect(wrapper.find(HorizontalNav).at(0).props().pages[1].name).toBe('Cluster Operators');
       expect(wrapper.find(HorizontalNav).at(0).props().pages[2].name).toBe('Global Configuration');
       expect(wrapper.find(HorizontalNav).at(0).props().pages[0].component).toEqual(ClusterVersionDetailsTable);
       expect(wrapper.find(HorizontalNav).at(0).props().pages[1].component).toEqual(ClusterOperatorTabPage);
       expect(wrapper.find(HorizontalNav).at(0).props().pages[2].component).toEqual(GlobalConfigPage);
    });
});

describe('Cluster Version Details Table page', () => {
    let wrapper;
    let cv:ClusterVersionKind;

    beforeEach(() => {
        cv = clusterVersionProps;

        wrapper = shallow(<ClusterVersionDetailsTable obj={cv} autoscalers={[]} />)
    });

    it('should render ClusterVersionDetailsTable component', () => {
        expect(wrapper.exists()).toBe(true);
    });
    it('should render the child components of ClusterVersionDetailsTable component', () => {
        expect(wrapper.containsAllMatchingElements([
            <CurrentChannel cv={cv} />,
            <CurrentVersionHeader cv={cv} />,
            <CurrentVersion cv={cv} />,
            <UpdateLink cv={cv} />,
            <UpdateStatus cv={cv} />,
            <ResourceLink />,
            <AddCircleOIcon />,
        ])).toEqual(true);
    });

    it('should render correct values of ClusterVersionDetailsTable component', () => {
        expect(wrapper.find(CurrentChannel).at(0).props().cv.spec.channel).toEqual('stable-4.2');
        expect(wrapper.find(CurrentVersion).at(0).props().cv.status.desired.version).toEqual('4.2.0-0.ci-2019-07-22-025130');
        //expect(wrapper.find(UpdatesAvailableMessage).at(0).text()).toEqual('stable-4.');
       // expect(wrapper.find('.co-detail-table__row .co-m-pane__details dd').at(2).text()).toEqual('342d8338-c08f-44ae-a82e-a032a4481fa9');

        expect(wrapper.find('.co-break-all').at(0).text()).toEqual('342d8338-c08f-44ae-a82e-a032a4481fa9');
        expect(wrapper.find('.co-break-all').at(1).text()).toEqual('registry.svc.ci.openshift.org/ocp/release@sha256:12da30aa8d94d8d4d4db3f8c88a30b6bdaf847bc714b2a551a2637a89c36f3c1');
        expect(wrapper.find(ResourceLink).at(0).props().name).toEqual('version');
        expect(wrapper.find(Link).childAt(1).text()).toEqual('Create Autoscaler');

        expect(wrapper.find('.co-break-all').at(2).text()).toEqual('4.2.0-0.ci-2019-07-22-025130');
        expect(wrapper.find('.co-m-pane__body tbody tr td').at(1).text()).toEqual('Completed');
        expect(wrapper.find(Timestamp).at(0).props().timestamp).toEqual('2019-07-29T09:04:05Z');
        expect(wrapper.find(Timestamp).at(1).props().timestamp).toEqual('2019-07-29T09:20:13Z');
    });
});

describe('Current Channel', () => {
    let wrapper;
    let cv: ClusterVersionKind;

    beforeEach(() => {
        cv = clusterVersionProps;

        wrapper = mount(<CurrentChannel cv={cv} />);
    });

    it('should accept props', () => {
        expect(wrapper.props().cv).toEqual(clusterVersionProps);
    });
    it('should render the value of channel', () => {
        expect(wrapper.text()).toBe('stable-4.2');
    });

    it('calls the dependency - clusterChannelModal with props', () => {
        dependency.clusterChannelModal = jest.fn();

        wrapper.find('button').first().simulate('click');
        expect(dependency.clusterChannelModal).toHaveBeenCalledTimes(1);
        const props = { cv: cv };
        expect(dependency.clusterChannelModal).toBeCalledWith(props);
    });
});
describe('Update Status', () => {
    let wrapper;
    let cv: ClusterVersionKind;

    beforeEach(() => {
        cv = clusterVersionProps

        wrapper = shallow(<UpdateStatus cv={cv} />);
    });

   xit('should render the default value', () => { //updated
        expect(wrapper.text()).toBe(' Up to date');
    });
    xit('should render the set value', () => {
        expect(wrapper.find(getClusterUpdateStatus)).toBe('Error retrieving');
    });

});
describe('Current Version', () => {
    let wrapper;
    let cv: ClusterVersionKind;

    beforeEach(() => {
        cv = clusterVersionProps

        wrapper = shallow(<CurrentVersion cv={cv} />);
    });

    it('should render the Current Version value', () => {
        expect(wrapper.text()).toBe('4.2.0-0.ci-2019-07-22-025130');
    });

});
describe('Current Version Header', () => {
    let wrapper;
    let cv: ClusterVersionKind;

    beforeEach(() => {
        cv = clusterVersionProps

        wrapper = shallow(<CurrentVersionHeader cv={cv} />);
    });

    // check for correctness
    it('should render the Current Version value', () => {
        wrapper.setProps(cv);
        expect(wrapper.text()).toBe('Last Completed Version'); // updated
    });


});

describe('Using Mount : Cluster Version Details Table page', () => {
    let wrapper;

    let cv;

    beforeEach(() => {
        cv = clusterVersionProps;

        wrapper = shallow(<ClusterVersionDetailsTable obj={cv} autoscalers={[]} />);
    });

});