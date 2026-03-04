import type { FC, ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormikConfig } from 'formik';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import * as rbacModule from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import { GitProvider } from '@console/git-service/src';
import * as serverlessFxUtils from '@console/git-service/src/utils/serverless-strategy-detector';
import store from '@console/internal/redux';
import { BuildStrategyType } from '../../types';
import type { SourceSectionFormData } from '../SourceSection';
import SourceSection from '../SourceSection';

// Skip Firehose fetching and render just the children
jest.mock('@console/internal/components/utils/firehose', () => ({
  ...jest.requireActual('@console/internal/components/utils/firehose'),
  Firehose: ({ children }) => children,
}));

// Skip network calls to any external git service
jest.mock('@console/git-service', () => ({
  ...jest.requireActual('@console/git-service'),
  getGitService: function mockedGetGitService() {
    return null;
  },
}));

jest.mock('../EditorField', () =>
  jest.requireActual('@console/shared/src/components/formik-fields/TextAreaField'),
);

jest.mock('@console/dynamic-plugin-sdk/src/app/components/utils/rbac', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/app/components/utils/rbac'),
  useAccessReview: jest.fn(),
}));

jest.mock('@console/git-service/src/utils/serverless-strategy-detector', () => ({
  ...jest.requireActual('@console/git-service/src/utils/serverless-strategy-detector'),
  evaluateFunc: jest.fn(),
}));

const spyUseAccessReview = rbacModule.useAccessReview as jest.Mock;
const spyEvaluateFunc = serverlessFxUtils.evaluateFunc as jest.Mock;

interface WrapperProps extends FormikConfig<SourceSectionFormData> {
  children?: ReactNode;
}

const Wrapper: FC<WrapperProps> = ({ children, ...formikConfig }) => (
  <Provider store={store}>
    <Formik {...formikConfig}>
      {(formikProps) => (
        <form onSubmit={formikProps.handleSubmit}>
          {children}
          <input type="submit" value="Submit" />
        </form>
      )}
    </Formik>
  </Provider>
);

const getPatternFlyInputForLabel = (label: string) =>
  screen.getByText(label).parentElement.parentElement.parentElement.querySelector('input');

const initialValues: SourceSectionFormData = {
  formData: {
    source: {
      type: 'none',
      git: {
        formType: 'edit',
        name: '',
        git: {
          url: '',
          type: GitProvider.INVALID,
          ref: '',
          dir: '/',
          showGitType: false,
          secret: '',
          isUrlValidating: false,
        },
        image: {
          selectedKey: '',
          selected: '',
          recommended: '',
          // tag: '',
          tagObj: '',
          // ports: [],
          // isRecommending: false,
          couldNotRecommend: false,
        },
        application: {
          selected: '',
          selectedKey: '',
          name: '',
          isInContext: null,
        },
        build: {
          strategy: BuildStrategyType.Source,
        },
        project: {
          name: '',
        },
      },
      dockerfile: '',
    },
  },
};

describe('SourceSection', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render form with minimal form data', () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SourceSection />
      </Wrapper>,
    );

    renderResult.getByTestId('section source');
    renderResult.getByText('Source type');
    renderResult.getByText('Please select your source type');

    // Expect that git input form and docker input field are not visible yet
    expect(renderResult.queryByText('Git Repo URL')).toBeFalsy();
    expect(renderResult.queryByText('Show advanced Git options')).toBeFalsy();
    expect(renderResult.queryAllByText('Dockerfile')).toHaveLength(0);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render git input field when user selects git', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    spyUseAccessReview.mockReturnValue([true]);
    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SourceSection />
      </Wrapper>,
    );

    // Select git
    await user.click(renderResult.getByText('Please select your source type'));
    await user.click(renderResult.getByText('Git'));

    // Assert subforms
    await waitFor(() => {
      expect(renderResult.queryByText('Git Repo URL')).toBeTruthy();
      expect(renderResult.queryByText('Show advanced Git options')).toBeTruthy();
      expect(renderResult.queryAllByText('Dockerfile')).toHaveLength(0);
    });

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render dockerfile input field when user selects dockerfile ', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SourceSection />
      </Wrapper>,
    );

    // Select Dockerfile
    expect(renderResult.queryAllByText('Dockerfile')).toHaveLength(0);
    await user.click(renderResult.getByText('Please select your source type'));

    expect(renderResult.queryAllByText('Dockerfile')).toHaveLength(1);
    await user.click(renderResult.getByText('Dockerfile'));

    // Assert subforms
    await waitFor(() => {
      expect(renderResult.queryByText('Git Repo URL')).toBeFalsy();
      expect(renderResult.queryByText('Show advanced Git options')).toBeFalsy();
      expect(renderResult.queryAllByText('Dockerfile')).toHaveLength(2);
    });

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should update form data correct after entering a git url and branch (ref)', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    spyUseAccessReview.mockReturnValue([true]);
    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SourceSection />
      </Wrapper>,
    );

    // Fill out subform
    await user.click(renderResult.getByText('Please select your source type'));
    await user.click(renderResult.getByText('Git'));
    await user.click(renderResult.getByText('Show advanced Git options'));

    await user.type(
      getPatternFlyInputForLabel('Git Repo URL'),
      'https://github.com/openshift/console',
    );

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: SourceSectionFormData = {
      formData: {
        source: {
          type: 'git',
          git: {
            formType: 'edit',
            name: '',
            git: {
              type: GitProvider.INVALID,
              url: 'https://github.com/openshift/console',
              ref: '',
              dir: '/',
              secret: '',
              isUrlValidating: false,
              showGitType: false,
            },
            image: expect.anything(),
            application: expect.anything(),
            build: expect.anything(),
            project: expect.anything(),
          },
          dockerfile: '',
        },
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  }, 30000); // userEvent.type is slow

  it('should update form data correct after selecting and entering a dockerfile', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    spyEvaluateFunc.mockReturnValue({
      isBuilderS2I: false,
      values: {},
    });
    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SourceSection />
      </Wrapper>,
    );

    // Fill out subform
    await user.click(renderResult.getByText('Please select your source type'));
    await user.click(renderResult.getByText('Dockerfile'));
    await user.type(renderResult.getByRole('textbox'), 'FROM: centos\nRUN echo hello world');

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: SourceSectionFormData = {
      formData: {
        source: {
          type: 'dockerfile',
          git: {
            formType: 'edit',
            name: '',
            git: {
              type: GitProvider.INVALID,
              url: '',
              ref: '',
              dir: '/',
              secret: '',
              isUrlValidating: false,
              showGitType: false,
            },
            image: expect.anything(),
            application: expect.anything(),
            build: expect.anything(),
            project: expect.anything(),
          },
          dockerfile: 'FROM: centos\nRUN echo hello world',
        },
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  }, 30000); // userEvent.type is slow
});
