import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import * as Router from 'react-router-dom-v5-compat';
import { pipelineTestData, PipelineExampleNames } from '../../../../test-data/pipeline-data';
import PipelineBuilderPage from '../PipelineBuilderPage';

type PipelineBuilderPageProps = React.ComponentProps<typeof PipelineBuilderPage>;
type BuilderProps = React.ComponentProps<typeof Formik>;

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

const { pipeline } = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
describe('PipelineBuilderPage Form', () => {
  let PipelineBuilderPageWrapper: ShallowWrapper<PipelineBuilderPageProps>;

  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'default' });
    PipelineBuilderPageWrapper = shallow(<PipelineBuilderPage />);
  });

  it('should render a Formik component', () => {
    const PipelineBuilderForm = PipelineBuilderPageWrapper.find(Formik);
    expect(PipelineBuilderForm).toHaveLength(1);
  });

  it('should have form view as default option and empty default values', () => {
    const PipelineBuilderForm = PipelineBuilderPageWrapper.find(Formik);
    const builderProps = PipelineBuilderForm.props() as BuilderProps;

    expect(builderProps.initialValues.editorType).toBe('form');
    expect(builderProps.initialValues.formData.params).toHaveLength(0);
    expect(builderProps.initialValues.formData.tasks).toHaveLength(0);
    expect(builderProps.initialValues.formData.resources).toHaveLength(0);
  });

  it('should contain the given pipeline values in intialValues', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'default' });
    PipelineBuilderPageWrapper = shallow(<PipelineBuilderPage existingPipeline={pipeline} />);
    const PipelineBuilderForm = PipelineBuilderPageWrapper.find(Formik);
    const builderProps = PipelineBuilderForm.props() as BuilderProps;
    const { name, tasks } = builderProps.initialValues.formData;

    expect(name).toBe(pipeline.metadata.name);
    expect(tasks).toHaveLength(pipeline.spec.tasks.length);
  });
});
