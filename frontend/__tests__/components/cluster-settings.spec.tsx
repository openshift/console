import * as React from 'react';
import { shallow, mount, } from 'enzyme';

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
    K8sResourceKind,
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
    let obj: ClusterVersionKind;

    beforeEach(() => {
        obj = {
            spec: {
                channel: 'string';
                clusterID: "string",
                desiredUpdate: { image: 'string', version: 'string' },
                upstream: 'string'
            }, status: {
                availableUpdates: [],
                conditions: [],
                desired: { image: 'string', version: 'string' },
                history: []
            },
            metadata: { name: 'string', namespace: '' }
        }

        wrapper = shallow(<ClusterVersionDetailsTable obj={obj} autoscalers={[]} />);
    });

    it('should render ClusterVersionDetailsTable component', () => {
        expect(wrapper.exists()).toBe(true);
    });
    it('should render correct Cluster Settings page title', () => {
        expect(wrapper.contains('Channel')).toBeTruthy();
    });
    it('should render the Firehose Component', () => {
        expect(wrapper.containsAllMatchingElements([
            <CurrentChannel cv={obj} />,
            <CurrentVersionHeader cv={obj} />,
            <CurrentVersion cv={obj} />,
            <UpdateLink cv={obj} />,
            <UpdateStatus cv={obj} />,
            <ResourceLink />,
            <AddCircleOIcon />,
        ])).toEqual(true);
    });
    it('should render correct  title', () => {
        expect(wrapper.contains('Channel')).toBeTruthy();
    });
    it('should render correct  title', () => {
        expect(wrapper.contains('Update Status')).toBeTruthy();
    });
});