import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import PipelineForm from '../../pipeline-form/PipelineForm';
import PipelineResources from '../PipelineResources';

const pipelineFormProps: React.ComponentProps<typeof PipelineForm> = {
  PipelineFormComponent: PipelineResources,
  formName: 'resources',
  obj: {},
};

describe('Pipeline details resource tab for pipeline without resources', () => {
  const obj = { metadata: { name: 'my-pipeline', namespace: 'test' } };
  const expected = { parameters: [], resources: [] };
  const plFormWrapper: ShallowWrapper = shallow(<PipelineForm {...pipelineFormProps} obj={obj} />);

  it('Should render a formik component', () => {
    expect(plFormWrapper.find('Formik').exists()).toBe(true);
  });

  it('Should render the pipeline resources form', () => {
    const formWrapper = plFormWrapper.find('Formik').shallow();
    expect(formWrapper.find('PipelineResources').exists()).toBe(true);
  });

  it('Should render no resources', () => {
    const formWrapper = plFormWrapper.find('Formik').shallow();
    const params = formWrapper.find('PipelineResources').prop('values');
    expect(params).toEqual(expected);
  });
});

describe('Pipeline details resource tab for pipeline with resources', () => {
  const obj = {
    metadata: { name: 'my-pipeline', namespace: 'test' },
    spec: { resources: [{ name: 'source', type: 'image' }] },
  };
  const expected = {
    parameters: [],
    resources: [{ name: 'source', type: 'image' }],
  };
  const plFormWrapper: ShallowWrapper = shallow(<PipelineForm {...pipelineFormProps} obj={obj} />);

  it('Should render a formik component', () => {
    expect(plFormWrapper.find('Formik').exists()).toBe(true);
  });

  it('Should render the pipeline resources form', () => {
    const formWrapper = plFormWrapper.find('Formik').shallow();
    expect(formWrapper.find('PipelineResources').exists()).toBe(true);
  });

  it('Should render the correct resources', () => {
    const formWrapper = plFormWrapper.find('Formik').shallow();
    const params = formWrapper.find('PipelineResources').prop('values');
    expect(params).toEqual(expected);
  });
});
