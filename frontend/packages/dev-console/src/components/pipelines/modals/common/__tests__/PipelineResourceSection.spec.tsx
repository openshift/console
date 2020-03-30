import * as React from 'react';
import { Formik } from 'formik';
import { shallow, ShallowWrapper } from 'enzyme';
import * as Renderer from 'react-test-renderer';
import { PipelineResource } from '../../../../../utils/pipeline-augment';
import PipelineResourceSection, { ResourceSectionProps } from '../PipelineResourceSection';

jest.mock('react-dom', () => ({
  findDOMNode: () => ({}),
  createPortal: (node) => node,
}));

jest.mock('../PipelineResourceDropdownField');

describe('PipelineResourceSection component', () => {
  const resources: PipelineResource[] = [
    { name: 'mapit-git', type: 'git' },
    { name: 'mapit-image', type: 'image' },
  ];
  let wrapper: ShallowWrapper<ResourceSectionProps>;
  beforeEach(() => {
    wrapper = shallow(<PipelineResourceSection resourceList={resources} />);
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
        {() => <PipelineResourceSection resourceList={resources} />}
      </Formik>,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
