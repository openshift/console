import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import { pipelineTestData, PipelineExampleNames } from '../../../../test-data/pipeline-data';
import PipelineBuilderPage from '../PipelineBuilderPage';

type PipelineBuilderPageProps = React.ComponentProps<typeof PipelineBuilderPage>;
type BuilderProps = React.ComponentProps<typeof Formik>;

const { pipeline } = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
describe('PipelineBuilderPage Form', () => {
  let formProps: PipelineBuilderPageProps;
  let PipelineBuilderPageWrapper: ShallowWrapper<PipelineBuilderPageProps>;

  beforeEach(() => {
    formProps = {
      history: null,
      location: null,
      match: { params: { ns: 'default' }, isExact: true, path: '', url: '' },
    };
    PipelineBuilderPageWrapper = shallow(<PipelineBuilderPage {...formProps} />);
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
    PipelineBuilderPageWrapper = shallow(
      <PipelineBuilderPage {...formProps} existingPipeline={pipeline} />,
    );
    const PipelineBuilderForm = PipelineBuilderPageWrapper.find(Formik);
    const builderProps = PipelineBuilderForm.props() as BuilderProps;
    const { name, tasks } = builderProps.initialValues.formData;

    expect(name).toBe(pipeline.metadata.name);
    expect(tasks).toHaveLength(pipeline.spec.tasks.length);
  });
});
