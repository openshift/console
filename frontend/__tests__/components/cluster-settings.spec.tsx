import * as React from 'react';
import { shallow, mount, ReactWrapper } from 'enzyme';

import { clusterVersionProps } from '../../__mocks__/clusterVersinMock';
import {
    ClusterSettingsPage,
    ClusterVersionDetailsTable,
    CurrentChannel,
    CurrentVersionHeader,
    CurrentVersion,
    UpdateLink,
    UpdateStatus,
    clusterAutoscalerReference,


} from '../../public/components/cluster-settings/cluster-settings';
import {
    ClusterVersionKind,
    clusterVersionReference,
    getClusterUpdateStatus,
    ClusterUpdateStatus,
    getClusterID,
    K8sResourceKind,
} from '../../public/module/k8s';
import {
    Firehose,
    HorizontalNav,
    ResourceLink,
    SectionHeading,
} from '../../public/components/utils';
import {
    AddCircleOIcon,
} from '@patternfly/react-icons';
import { PodModel, } from '../../public/models';
import { referenceForModel } from '../../public/module/k8s';
import { Firehose } from '../../public/components/utils';
import * as dependency from '../../public/components/modals';




describe('Cluster Settings page', () => {
    let wrapper;

    beforeEach(() => {
        const match = { url: '', params: { ns: 'default', plural: 'pods' }, isExact: true, path: '' };
        wrapper = shallow(<ClusterSettingsPage match={match} />);
    });


    it('should render ClusterSettingsPage component', () => {
        expect(wrapper.exists()).toBe(true);
    });
    it('should render correct Cluster Settings page title', () => {
        expect(wrapper.contains('Cluster Settings')).toBeTruthy();
    });
    xit('should render the Firehose Component', () => {
        const resources = [
            { kind: clusterVersionReference, name: 'version', isList: false, prop: 'obj' },
            { kind: clusterAutoscalerReference, isList: true, prop: 'autoscalers', optional: true },
        ];
        expect(wrapper.containsMatchingElement(<Firehose resources={resources} />)).toEqual(true);
    });
    it('should render the HorizontalNav Component', () => {
        expect(wrapper.containsMatchingElement(<HorizontalNav />)).toEqual(true);
    });

    xit('renders main and sub category tabs', () => {
        const tabs = wrapper.find(HorizontalNav);
        // console.log("tab", tabs)
        expect(tabs.exists()).toBe(true);
        expect(tabs.props().length).toEqual(20); // 'All' through 'Other', plus subcategories
    });

    xit('renders a `Firehose` using the given props', () => {
        expect(wrapper.find<any>(Firehose).props().resources[1]).toEqual({
            kind: referenceForModel(PodModel),
            name: 'version',
            isList: false,
            prop: 'obj',
        });
    });
});

describe('Cluster Version Details Table page', () => {
    let wrapper;
    let cv: ClusterVersionKind;

    beforeEach(() => {
        cv = clusterVersionProps;

        wrapper = shallow(<ClusterVersionDetailsTable obj={cv} autoscalers={[]} />)
    });

    it('should render ClusterVersionDetailsTable component', () => {
        expect(wrapper.exists()).toBe(true);
    });
    it('should render correct Cluster Settings page title', () => {
        expect(wrapper.contains('Channel')).toBeTruthy();
    });
    it('should render the Firehose Component', () => {
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
    it('should render correct title Channel', () => {
        expect(wrapper.contains('Channel')).toBeTruthy();
    });
    it('should render correct  title Update Status', () => {
        expect(wrapper.contains('Update Status')).toBeTruthy();
    });

    it('should render correct Cluster ID, Desired Release Image, and Cluster Version Configuration values', () => {
        const row0 = wrapper.childAt(0).childAt(1).childAt(0);

        expect((row0.props().children[0])).toEqual(<dt>Cluster ID</dt>);
        expect((row0.props().children[1])).toEqual(<dd className="co-break-all co-select-to-copy">342d8338-c08f-44ae-a82e-a032a4481fa9</dd>);
        // expect((row0.props().children[2])).toEqual(<dt>Desired Release Image</dt>);
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

        wrapper = mount(<UpdateStatus cv={cv} />);
    });

    it('should render the default value', () => {

        expect(wrapper.text()).toBe(' Up to date');
    });
    xit('should render the set value', () => {
        wrapper.instance().status = "Invalid"
        expect(wrapper.text()).toBe(' Up to date');
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
        expect(wrapper.text()).toBe('Current Version');
    });


});

describe('Using Mount : Cluster Version Details Table page', () => {
    let wrapper;

    let cv;

    beforeEach(() => {
        cv = clusterVersionProps;

        wrapper = mount(<ClusterVersionDetailsTable obj={cv} autoscalers={[]} />);
    });


    xit('should render correct Cluster ID, Desired Release Image, and Cluster Version Configuration values', () => {
        const row0 = wrapper.childAt(0).childAt(1).childAt(0);

        //  const checkList = wrapper.props();
        //  console.log(checkList);
        //  expect(checkList.obj.spec.clusterID).toEqual("342d8338-c08f-44ae-a82e-a032a4481fa9");

        // expect((row0.props().children[0])).toEqual(<dt>Cluster ID</dt>);
        // expect((row0.props().children[1])).toEqual(<dd className="co-break-all co-select-to-copy">342d8338-c08f-44ae-a82e-a032a4481fa9</dd>);
        // expect((row0.props().children[2])).toEqual(<dt>Desired Release Image</dt>);
        // expect((row0.props().children[3])).toEqual(<dt>Desired Release Image</dt>);
        // expect((row0.props().children[4])).toEqual(<dt>Cluster Version Configuration</dt>);
        // expect((row0.props().children[5])).toEqual(<dt>Desired Release Image</dt>);

        //expect(wrapper.find('.co-break-all3fdd')).toEqual(<dt>Desired Release Image</dt>);
    });
});