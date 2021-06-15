import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import { InputField } from '@console/shared';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import * as hooks from '../devfile/devfileHooks';
import DevfileImportForm from '../devfile/DevfileImportForm';
import DevfileSampleInfo from '../devfile/DevfileSampleInfo';
import GitSection from '../git/GitSection';

let devfileImportFormProps: React.ComponentProps<typeof DevfileImportForm>;

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
  })),
}));

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

const devfileServerSpy = jest.spyOn(hooks, 'useDevfileServer');
const selectedDevfileSampleSpy = jest.spyOn(hooks, 'useSelectedDevfileSample');

const i18nNS = 'devconsole~';

describe('DevfileImportForm', () => {
  beforeEach(() => {
    devfileImportFormProps = {
      ...formikFormProps,
      values: {
        name: 'xyz',
        git: {
          url: 'https://github.com/xyz.com',
          ref: '',
          dir: '/',
        },
        devfile: {
          devfileContent: 'abc',
          devfileHasError: 'true',
          devfilePath: './devfile.yaml',
          devfileSourceUrl: 'https://github.com/xyz.com',
        },
      },
      builderImages: undefined,
      projects: {
        loaded: true,
        data: [],
      },
    };
  });

  it('should show an alert if the devfile is not parseable', () => {
    devfileServerSpy.mockReturnValue([null, 'The Devfile in your Git repository is invalid.']);
    const wrapper = shallow(<DevfileImportForm {...devfileImportFormProps} />);
    expect(wrapper.find(Alert).exists()).toBe(true);
    expect(wrapper.find(Alert).props().variant).toBe('danger');
    expect(wrapper.find(Alert).props().title).toBe(`${i18nNS}Import is not possible.`);
    expect(wrapper.find(Alert).props().children).toBe(
      'The Devfile in your Git repository is invalid.',
    );
  });

  it('should not show any alert if the devfile is parseable', () => {
    devfileServerSpy.mockReturnValue([null, null]);
    const wrapper = shallow(<DevfileImportForm {...devfileImportFormProps} />);
    expect(wrapper.find(Alert).exists()).toBe(false);
  });

  it('should show devfile info if a sample is pre-selected', () => {
    selectedDevfileSampleSpy.mockReturnValue({
      name: 'nodejs',
      displayName: 'Node JS',
      description: 'node-abc',
      icon: 'node.png',
      tags: undefined,
      projectType: 'undefined',
      language: 'xyz',
      git: {
        remotes: {
          mno: 'jjkj',
        },
      },
    });
    const wrapper = shallow(<DevfileImportForm {...devfileImportFormProps} />);
    expect(wrapper.find(DevfileSampleInfo).exists()).toBe(true);
  });

  it('should not show devfile info if no sample is selected', () => {
    selectedDevfileSampleSpy.mockReturnValue(undefined);
    const wrapper = shallow(<DevfileImportForm {...devfileImportFormProps} />);
    expect(wrapper.find(DevfileSampleInfo).exists()).toBe(false);
  });

  it('should render the input text field if form type is sample', () => {
    const url =
      '/import/ns/abc?importType=devfile&formType=sample&devfileName=nodejs-basic&gitRepo=https://github.com/redhat-developer/devfile-sample.git';

    Object.defineProperty(window.location, 'search', {
      writable: true,
      value: url,
    });
    const wrapper = shallow(<DevfileImportForm {...devfileImportFormProps} />);
    expect(wrapper.find(InputField).exists()).toBe(true);
    expect(wrapper.find(InputField).props().isDisabled).toBe(true);
  });

  it('should render the GitSection component if form type is not sample', () => {
    const url = '/import/ns/abc?importType=devfile';

    Object.defineProperty(window.location, 'search', {
      writable: true,
      value: url,
    });
    const wrapper = shallow(<DevfileImportForm {...devfileImportFormProps} />);
    expect(wrapper.find(InputField).exists()).toBe(false);
    expect(wrapper.find(GitSection).exists()).toBe(true);
    expect(wrapper.find(GitSection).props().defaultSample.url).toBe(
      'https://github.com/redhat-developer/devfile-sample',
    );
  });

  it('should render the GitSection component if form type is not sample and url contains the git repo url', () => {
    const url =
      '/import/ns/abc?importType=devfile&devfileName=nodejs-basic&gitRepo=https://github.com/elsony/devfile-sample-python-basic.git';

    Object.defineProperty(window.location, 'search', {
      writable: true,
      value: url,
    });
    const wrapper = shallow(<DevfileImportForm {...devfileImportFormProps} />);
    expect(wrapper.find(GitSection).exists()).toBe(true);
    expect(wrapper.find(GitSection).props().defaultSample.url).toBe(
      'https://github.com/elsony/devfile-sample-python-basic.git',
    );
  });
});
