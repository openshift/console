/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash-es';

import { Firehose, FirehoseResource, firehoseFor } from '../../../public/components/utils';

describe('firehoseFor', () => {
  type ComponentProps = {pods: any, namespace: string};
  let resources: {pods: FirehoseResource};
  const Component: React.SFC<ComponentProps> = (props) => <span>{props.pods.loaded}</span>;

  beforeEach(() => {
    resources = {
      pods: {kind: 'Pod', isList: true},
    };
  });

  it('returns a component which accepts a render callback', (done) => {
    const FirehosedComponent = firehoseFor(resources);
    const render = () => {
      done();
      return <div />;
    };

    shallow(<FirehosedComponent render={render} />).childAt(0).dive();
  });

  it('wraps render callback component in a `Firehose`', () => {
    const FirehosedComponent = firehoseFor(resources);
    const wrapper = shallow(<FirehosedComponent render={(props) => <Component namespace="default" pods={props.pods} />} />);

    expect(wrapper.find(Firehose).childAt(0).shallow().find(Component).exists()).toBe(true);
  });

  it('passes `resources` to `Firehose` component', () => {
    const FirehosedComponent = firehoseFor(resources);
    const wrapper = shallow(<FirehosedComponent render={(props) => <Component namespace="default" pods={props.pods} />} />);

    expect(wrapper.find(Firehose).props().resources).toEqual(_.map(resources, (res, prop) => ({...res, prop})));
  });
});
