import * as React from 'react';
import { shallow } from 'enzyme';
import { LoadingBox } from '@console/internal/components/utils';
import AddPageLayout from '../add/AddPageLayout';
import ProjectsExistWrapper from '../ProjectsExistWrapper';

type ProjectsExistWrapperProps = React.ComponentProps<typeof ProjectsExistWrapper>;

let projectWrapperProps: ProjectsExistWrapperProps;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('ProjectsExistWrapper', () => {
  beforeEach(() => {
    projectWrapperProps = {
      title: 'Topology',
      projects: {
        data: [],
        loaded: true,
        loadError: '',
      },
      children: <span />,
    };
  });

  it('should show loading box', () => {
    projectWrapperProps.projects.loaded = false;
    const wrapper = shallow(<ProjectsExistWrapper {...projectWrapperProps} />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('should show empty state when no project exist', () => {
    const wrapper = shallow(<ProjectsExistWrapper {...projectWrapperProps} />);
    expect(wrapper.find(AddPageLayout).exists()).toBe(true);
  });

  it('should return children when project exist', () => {
    projectWrapperProps.projects.data = [
      {
        metadata: {
          name: 'test-project',
          uid: '3afaa628-fde7-4afa-8800-281b7b11f4bf',
          resourceVersion: '91841',
          creationTimestamp: '2019-12-19T16:08:38Z',
        },
      },
    ];
    const wrapper = shallow(<ProjectsExistWrapper {...projectWrapperProps} />);
    expect(wrapper.contains(<span />)).toBe(true);
  });
});
