import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as Renderer from 'react-test-renderer';
import PipelineResourceSection, {
  ResourceSectionProps,
} from '../pipeline-form/PipelineResourceSection';
import { Formik } from 'formik';

jest.mock('react-dom', () => ({
  findDOMNode: () => ({}),
  createPortal: (node) => node,
}));

jest.mock('../pipeline-form/PipelineResourceDropdownField');

describe('PipelineResourceSection component', () => {
  const resources = {
    types: ['git', 'image'],
    git: [{ name: 'mapit-git', type: 'git', resourceRef: { name: 'pipelineTest' }, index: 0 }],
    image: [{ index: 1, name: 'mapit-image', resourceRef: { name: '' }, type: 'image' }],
  };
  let wrapper: ShallowWrapper<ResourceSectionProps>;
  beforeEach(() => {
    wrapper = shallow(<PipelineResourceSection resources={resources} />);
  });

  it('It should render git and image sections', () => {
    expect(wrapper.find('[name="git"]').exists()).toBeTruthy();
    expect(wrapper.find('[name="image"]').exists()).toBeTruthy();
  });

  it('It should not render cluster and storage sections', () => {
    expect(wrapper.find('[name="cluster"]').exists()).toBeFalsy();
    expect(wrapper.find('[name="storage"]').exists()).toBeFalsy();
  });

  it('It should match the previous pipeline snapshot', () => {
    const tree = Renderer.create(
      <Formik onSubmit={() => {}} initialValues={{}}>
        {() => <PipelineResourceSection resources={resources} />}
      </Formik>,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
