import * as React from 'react';
import { configure, render, screen, waitFor } from '@testing-library/react';
import { Formik, FormikConfig } from 'formik';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { GitTypes } from '../../../import/import-types';
import userEvent from '../../__tests__/user-event';
import { BuildStrategyType } from '../../types';
import SourceSection, { SourceSectionFormData } from '../SourceSection';

// Skip Firehose fetching and render just the children
jest.mock('@console/internal/components/utils/firehose', () => {
  const firehoseUtil = jest.requireActual('@console/internal/components/utils/firehose');
  return {
    ...firehoseUtil,
    Firehose: ({ children }) => children,
  };
});

// Skip network calls to any external git service
jest.mock('@console/git-service', () => {
  const gitService = jest.requireActual('@console/git-service');
  return {
    ...gitService,
    getGitService: function mockedGetGitService() {
      return null;
    },
  };
});

jest.mock('../EditorField', () =>
  jest.requireActual('@console/shared/src/components/formik-fields/TextAreaField'),
);

configure({ testIdAttribute: 'data-test' });

const Wrapper: React.FC<FormikConfig<SourceSectionFormData>> = ({ children, ...formikConfig }) => (
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
          type: GitTypes.invalid,
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
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SourceSection />
      </Wrapper>,
    );

    // Select git
    userEvent.click(renderResult.getByText('Please select your source type'));
    userEvent.click(renderResult.getByText('Git'));

    // Assert subforms
    await waitFor(() => {
      expect(renderResult.queryByText('Git Repo URL')).toBeTruthy();
      expect(renderResult.queryByText('Show advanced Git options')).toBeTruthy();
      expect(renderResult.queryAllByText('Dockerfile')).toHaveLength(0);
    });

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render dockerfile input field when user selects dockerfile ', async () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SourceSection />
      </Wrapper>,
    );

    // Select Dockerfile
    expect(renderResult.queryAllByText('Dockerfile')).toHaveLength(0);
    userEvent.click(renderResult.getByText('Please select your source type'));

    expect(renderResult.queryAllByText('Dockerfile')).toHaveLength(1);
    userEvent.click(renderResult.getByText('Dockerfile'));

    // Assert subforms
    await waitFor(() => {
      expect(renderResult.queryByText('Git Repo URL')).toBeFalsy();
      expect(renderResult.queryByText('Show advanced Git options')).toBeFalsy();
      expect(renderResult.queryAllByText('Dockerfile')).toHaveLength(2);
    });

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should update form data correct after entering a git url and branch (ref)', async () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SourceSection />
      </Wrapper>,
    );

    // Fill out subform
    userEvent.click(renderResult.getByText('Please select your source type'));
    userEvent.click(renderResult.getByText('Git'));
    userEvent.click(renderResult.getByText('Show advanced Git options'));

    userEvent.type(
      getPatternFlyInputForLabel('Git Repo URL'),
      'https://github.com/openshift/console',
    );
    // TODO doesn't work at the moment?! userEvent.type(getPatternFlyInputForLabel('Git reference'), 'master');

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
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
              type: GitTypes.invalid,
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
  });

  it('should update form data correct after selecting and entering a dockerfile', async () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SourceSection />
      </Wrapper>,
    );

    // Fill out subform
    userEvent.click(renderResult.getByText('Please select your source type'));
    userEvent.click(renderResult.getByText('Dockerfile'));
    userEvent.type(renderResult.getByRole('textbox'), 'FROM: centos\nRUN echo hello world');

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
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
              type: GitTypes.invalid,
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
  });
});
