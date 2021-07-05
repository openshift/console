import * as React from 'react';
import { Alert, AlertActionLink } from '@patternfly/react-core';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import ToastContext, { ToastContextType, ToastVariant } from '../ToastContext';
import ToastProvider from '../ToastProvider';

describe('ToastProvider', () => {
  let toastContext: ToastContextType;
  let wrapper: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  beforeEach(() => {
    const TestComponent = () => {
      toastContext = React.useContext(ToastContext);
      return null;
    };
    wrapper = mount(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );
  });

  it('should provide a context', () => {
    expect(typeof toastContext.addToast).toBe('function');
    expect(typeof toastContext.removeToast).toBe('function');
  });

  it('should add and remove alerts', () => {
    // fixed id
    const id1 = 'foo';
    // generated id
    let id2: string;

    act(() => {
      toastContext.addToast({
        id: id1,
        title: 'test success',
        variant: ToastVariant.success,
        content: 'description 1',
      });
      id2 = toastContext.addToast({
        title: 'test danger',
        variant: ToastVariant.danger,
        content: 'description 2',
      });
    });

    wrapper.update();

    const alerts = wrapper.find(Alert);
    expect(alerts.length).toBe(2);

    expect(alerts.at(0).props()).toMatchObject({
      title: 'test success',
      variant: ToastVariant.success,
      children: 'description 1',
    });

    expect(alerts.at(1).props()).toMatchObject({
      title: 'test danger',
      variant: ToastVariant.danger,
      children: 'description 2',
    });

    act(() => {
      toastContext.removeToast(id1);
      toastContext.removeToast(id2);
    });

    wrapper.update();
    expect(wrapper.find(Alert).length).toBe(0);
  });

  it('should dismiss toast on action', () => {
    const actionFn = jest.fn();
    act(() => {
      toastContext.addToast({
        title: 'test success',
        variant: ToastVariant.success,
        content: 'description 1',
        actions: [
          {
            label: 'action 1',
            dismiss: true,
            callback: actionFn,
          },
        ],
      });
    });

    wrapper.update();

    expect(wrapper.find(Alert).length).toBe(1);
    const alertActionLinks = wrapper.find(AlertActionLink);
    expect(alertActionLinks.length).toBe(1);

    act(() => {
      alertActionLinks
        .at(0)
        .find('button')
        .simulate('click');
    });

    wrapper.update();

    expect(actionFn).toHaveBeenCalledTimes(1);

    expect(wrapper.find(Alert).length).toBe(0);
  });
});
