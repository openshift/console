import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { AsyncComponent } from '../../../public/components/utils/async';

describe('AsyncComponent', () => {
  let wrapper: ReactWrapper;
  const fooId = 'fooId';
  const Foo = (props: {className: string}) => <div id={fooId} className={props.className} />;
  const loadingBoxSelector = '.cos-status-box';

  beforeEach(() => {
    wrapper = null;
  });

  it('calls given loader function', (done) => {
    const loader = () => new Promise<typeof Foo>((resolve) => {
      resolve(Foo);
      done();
    });

    wrapper = mount(<AsyncComponent loader={loader} />);
  });

  it('renders `LoadingBox` before `loader` promise resolves', (done) => {
    const loader = () => new Promise<typeof Foo>(() => {
      setTimeout(() => {
        expect(wrapper.find(loadingBoxSelector).exists()).toBe(true);
        done();
      }, 10);
    });

    wrapper = mount(<AsyncComponent loader={loader} />);
  });

  it('continues to display `LoadingBox` if `loader` promise is rejected', (done) => {
    const loader = () => new Promise<typeof Foo>((_, reject) => {
      reject('epic fail');
      setTimeout(() => {
        expect(wrapper.find(loadingBoxSelector).exists()).toBe(true);
        done();
      }, 10);
    });

    wrapper = mount(<AsyncComponent loader={loader} />);
  });

  it('attempts to resolve `loader` promise again if rejected after waiting 100 * n^2 milliseconds (n = retry count)', (done) => {
    const start = Date.now();
    const end = 1000;

    const loader = jasmine.createSpy('loader').and.returnValue(new Promise((_, reject) => {
      expect(Date.now() > (start + (100 * Math.pow(loader.calls.count(), 2))));
      reject(null);
    }));

    wrapper = mount(<AsyncComponent loader={loader} />);
    setTimeout(() => {
      expect(loader.calls.count()).toEqual(Math.floor(Math.sqrt(end / 100)));
      done();
    }, end);
  });

  it('does not attempt to resolve `loader` promise again if it resolves an undefined component', (done) => {
    const loader = jasmine.createSpy('loader').and.returnValue(Promise.resolve(null));
    wrapper = mount(<AsyncComponent loader={loader} />);
    setTimeout(() => {
      expect(loader.calls.count()).toEqual(1);
      done();
    }, 200);
  });

  it('renders component resolved from `loader` promise', (done) => {
    const loader = () => new Promise<typeof Foo>((resolve) => {
      resolve(Foo);
      setTimeout(() => {
        expect(wrapper.update().find(`#${fooId}`).exists()).toBe(true);
        done();
      }, 10);
    });

    wrapper = mount(<AsyncComponent loader={loader} />);
  });

  it('passes given props to rendered component', (done) => {
    const className = 'col-md-1';
    const loader = () => new Promise<typeof Foo>((resolve) => {
      resolve(Foo);
      setTimeout(() => {
        expect(wrapper.update().find(`#${fooId}`).props().className).toEqual(className);
        done();
      }, 10);
    });

    wrapper = mount(<AsyncComponent loader={loader} className={className} />);
  });

  it('renders new component if `props.loader` changes', (done) => {
    const barId = 'barId';
    const Bar = (props: {className: string}) => <div id={barId} className={props.className} />;

    const loader1 = () => new Promise<typeof Foo>((resolve) => {
      resolve(Foo);
      setTimeout(() => {
        expect(wrapper.update().find(`#${fooId}`).exists()).toBe(true);
      }, 10);
    });

    const loader2 = () => new Promise<typeof Bar>((resolve) => {
      resolve(Bar);
      setTimeout(() => {
        expect(wrapper.update().find(`#${barId}`).exists()).toBe(true);
        done();
      }, 10);
    });

    wrapper = mount(<AsyncComponent loader={loader1} />);
    wrapper = wrapper.setProps({loader: loader2});
  });
});
