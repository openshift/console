import * as React from 'react';
import { Radio } from '@patternfly/react-core';
import { mount, ReactWrapper } from 'enzyme';
import i18n from 'i18next';
import { act } from 'react-dom/test-utils';
import { setI18n } from 'react-i18next';
import { Provider } from 'react-redux';
import { PageHeading, ButtonBar } from '@console/internal/components/utils/';
import store from '@console/internal/redux';
import NamespacedPage from '../../NamespacedPage';
import AdvancedSection from '../advanced/AdvancedSection';
import AppSection from '../app/AppSection';
import DeployImage from '../DeployImage';
import DeployImagePage from '../DeployImagePage';
import ImageSearchSection from '../image-search/ImageSearchSection';

jest.mock('@console/shared/src/hooks/post-form-submit-action', () => ({
  usePostFormSubmitAction: () => () => {},
}));

jest.mock('@console/shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: () => {},
}));

jest.mock('../serverless/useUpdateKnScalingDefaultValues', () => ({
  // Called in DeployImage
  useUpdateKnScalingDefaultValues: (initialValues) => initialValues,
}));

describe('DeployImage Page Test', () => {
  type DeployImagePageProps = React.ComponentProps<typeof DeployImagePage>;
  let deployImagePageProps: DeployImagePageProps;
  let deployImagePageWrapper: ReactWrapper;
  beforeEach(() => {
    i18n.services.interpolator = {
      init: () => undefined,
      reset: () => undefined,
      resetRegExp: () => undefined,
      interpolate: (str: string) => str,
      nest: (str: string) => str,
    };
    setI18n(i18n);

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
    expect(deployImagePageWrapper.find(PageHeading).prop('title')).toBe('Deploy Image');
  });
});

describe('Deploy Image Test', () => {
  type DeployImageProps = React.ComponentProps<typeof DeployImage>;
  let deployImageProps: DeployImageProps;
  let deployImageWrapper: ReactWrapper;
  beforeEach(async () => {
    i18n.services.interpolator = {
      init: () => undefined,
      reset: () => undefined,
      resetRegExp: () => undefined,
      interpolate: (str: string) => str,
      nest: (str: string) => str,
    };
    setI18n(i18n);

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
    // Workaround for error: "Warning: An update to Formik inside a test was not wrapped in act(...)."
    // Wait for an initial rerender because the shared InputFields forces an rerendering via useFormikValidationFix
    await act(async () => {
      deployImageWrapper.render();
    });
  });

  it('should load correct image search section radiobutton group', () => {
    expect(deployImageWrapper.find(ImageSearchSection).exists()).toBe(true);
    const radioButtons = deployImageWrapper.find(ImageSearchSection).find(Radio);
    expect(radioButtons.exists()).toBe(true);
    expect(radioButtons.length).toEqual(2);
    expect(radioButtons.at(0).prop('value')).toBe('external');
    expect(radioButtons.at(0).prop('label')).toBe('Image name from external registry');
    expect(radioButtons.at(0).prop('isChecked')).toBe(true);
    expect(radioButtons.at(1).prop('value')).toBe('internal');
    expect(radioButtons.at(1).prop('label')).toBe('Image stream tag from internal registry');
    expect(radioButtons.at(1).prop('isChecked')).toBe(false);
  });

  it('should load  correct app section', () => {
    expect(deployImageWrapper.find(AppSection).exists()).toBe(true);
  });
  it('should load  correct advanced section', () => {
    expect(deployImageWrapper.find(AdvancedSection).exists()).toBe(true);
  });
  it('should load  correct button bar', () => {
    expect(deployImageWrapper.find(ButtonBar).exists()).toBe(true);
  });
});
