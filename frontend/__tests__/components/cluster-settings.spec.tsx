import * as React from 'react';
import { shallow, mount, } from 'enzyme';

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
} from '../../public/module/k8s';
import {
    Firehose,
    HorizontalNav,
    ResourceLink,
} from '../../public/components/utils';
import {
    AddCircleOIcon,
} from '@patternfly/react-icons';


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
    // it('should render correct details', () => {
    //     const title = wrapper.find('.co-m-pane__heading');
    //     // console.log(title)
    //     expect(title).toBe({});
    // });
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
});

describe('Cluster Version Details Table page', () => {
    let wrapper;
    let cv: ClusterVersionKind;

    beforeEach(() => {
        cv = clusterVersionProps;


        wrapper = shallow(<ClusterVersionDetailsTable obj={cv} autoscalers={[]} />);
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
});
describe('Current Channel', () => {
    let wrapper;
    let cv: ClusterVersionKind;

    beforeEach(() => {
        cv = clusterVersionProps;

        wrapper = mount(<CurrentChannel cv={cv} />);
    });

    it('should render the value of channel', () => {
        // wrapper.setProps(obj.spec.channel);
        expect(wrapper.text()).toBe('stable-4.2');
    });
    xit('should render the  updated value of channel', () => {
        wrapper.setProps(cv.spec.channel);
        wrapper.instance().clusterChannelModal(cv);
        wrapper.instance().forceUpdate();
        expect(wrapper.text()).toBe('stable-4.2');
    });
    xit('should render the  updated value2 of channel', () => {
        const spy = jest.spyOn(wrapper.instance(), 'clusterChannelModal');
        wrapper.instance().forceUpdate();
        expect(spy).toHaveBeenCalledTimes(0);
        wrapper.find('button').first().simulate('click');
        expect(spy).toHaveBeenCalledTimes(1);
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
        // wrapper.setProps(obj.spec.channel);
        expect(wrapper.text()).toBe(' Up to date');
    });
    it('should render the set value', () => {
        // wrapper.setProps(obj.spec.channel);
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
        // wrapper.setProps(obj.spec.channel);
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