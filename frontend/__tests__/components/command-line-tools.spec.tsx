import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { CommandLineTools } from '@console/internal/components/command-line-tools';
import SecondaryHeading from '@console/shared/src/components/heading/SecondaryHeading';

const obj = {
  data: [
    {
      metadata: {
        name: 'helm-download-links',
        uid: '1',
      },
      spec: {
        displayName: 'helm - Helm 3 CLI',
        links: [],
      },
    },
    {
      metadata: {
        name: 'oc-cli-downloads',
        uid: '2',
      },
      spec: {
        displayName: 'oc - OpenShift Command Line Interface (CLI)',
        links: [],
      },
    },
  ],
  loaded: true,
  loadError: null,
};

// We have to mock the native ResizeObserver class or this test case will fail.
const nativeResizeObserver = window.ResizeObserver;
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('CommandLineTools', () => {
  describe('When ordering is correct', () => {
    beforeAll(() => {
      window.ResizeObserver = ResizeObserver;
    });
    afterAll(() => {
      window.ResizeObserver = nativeResizeObserver;
    });
    it('shows oc first', () => {
      const wrapper = mount(<CommandLineTools obj={obj} />, {
        wrappingComponent: Provider,
        wrappingComponentProps: { store },
      });
      expect(wrapper.find(SecondaryHeading).first().text()).toEqual(
        'oc - OpenShift Command Line Interface (CLI)',
      );
    });
  });
});
