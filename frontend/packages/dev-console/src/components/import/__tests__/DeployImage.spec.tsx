import * as React from 'react';
import { Radio } from '@patternfly/react-core';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';
import { PageHeading, ButtonBar } from '@console/internal/components/utils/';
import store from '@console/internal/redux';
import NamespacedPage from '../../NamespacedPage';
import AdvancedSection from '../advanced/AdvancedSection';
import AppSection from '../app/AppSection';
import DeployImage from '../DeployImage';
import DeployImagePage from '../DeployImagePage';
import ImageSearchSection from '../image-search/ImageSearchSection';
import ResourceSection from '../section/ResourceSection';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
    withTranslation: () => (Component) => {
      Component.defaultProps = { ...Component.defaultProps, t: (s) => s };
      return Component;
    },
  };
});

jest.mock('@console/shared/src/hooks/post-form-submit-action', () => {
  return {
    usePostFormSubmitAction: () => () => {},
  };
});

jest.mock('@console/shared/src/hooks/useResizeObserver', () => {
  return {
    useResizeObserver: () => {},
  };
});

const i18ns = 'devconsole';

describe('DeployImage Page Test', () => {
  type DeployImagePageProps = React.ComponentProps<typeof DeployImagePage>;
  let deployImagePageProps: DeployImagePageProps;
  let deployImagePageWrapper: ReactWrapper;
  beforeAll(() => {
    deployImagePageProps = {
      history: null,
      location: {
        pathname: 'deploy-image/ns/openshift?preselected-ns=openshift',
        search: 'deploy-image/ns/openshift?preselected-ns=openshift',
        state: null,
        hash: null,
      },
      match: {
        isExact: true,
        path: 'deploy-image/ns/openshift?preselected-ns=openshift',
        url: 'deploy-image/ns/openshift?preselected-ns=openshift',
        params: {
          ns: 'openshift',
        },
      },
    };
    deployImagePageWrapper = mount(<DeployImagePage {...deployImagePageProps} />, {
      wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  });
  it('should render a namespaced page', () => {
    expect(deployImagePageWrapper.find(NamespacedPage).exists()).toBe(true);
  });
  it('should render correct page title', () => {
    expect(deployImagePageWrapper.find(PageHeading).exists()).toBe(true);
    expect(deployImagePageWrapper.find(PageHeading).prop('title')).toBe('devconsole~Deploy Image');
  });
});

describe('Deploy Image Test', () => {
  type DeployImageProps = React.ComponentProps<typeof DeployImage>;
  let deployImageProps: DeployImageProps;
  let deployImageWrapper: ReactWrapper;
  beforeAll(() => {
    deployImageProps = {
      projects: {
        data: [],
        loaded: false,
      },
      namespace: 'my-project',
    };
    deployImageWrapper = mount(<DeployImage {...deployImageProps} />, {
      wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  });

  it('should load correct image search section radiobutton group', () => {
    expect(deployImageWrapper.find(ImageSearchSection).exists()).toBe(true);
    const radioButtons = deployImageWrapper.find(ImageSearchSection).find(Radio);
    expect(radioButtons.exists()).toBe(true);
    expect(radioButtons.length).toEqual(2);
    expect(radioButtons.at(0).prop('value')).toBe('external');
    expect(radioButtons.at(0).prop('label')).toBe(`${i18ns}~Image name from external registry`);
    expect(radioButtons.at(0).prop('isChecked')).toBe(true);
    expect(radioButtons.at(1).prop('value')).toBe('internal');
    expect(radioButtons.at(1).prop('label')).toBe(
      `${i18ns}~Image stream tag from internal registry`,
    );
    expect(radioButtons.at(1).prop('isChecked')).toBe(false);
  });

  it('should load  correct app section', () => {
    expect(deployImageWrapper.find(AppSection).exists()).toBe(true);
  });
  it('should load  correct resource section', () => {
    expect(deployImageWrapper.find(ResourceSection).exists()).toBe(true);
  });
  it('should load  correct advanced section', () => {
    expect(deployImageWrapper.find(AdvancedSection).exists()).toBe(true);
  });
  it('should load  correct button bar', () => {
    expect(deployImageWrapper.find(ButtonBar).exists()).toBe(true);
  });
});
