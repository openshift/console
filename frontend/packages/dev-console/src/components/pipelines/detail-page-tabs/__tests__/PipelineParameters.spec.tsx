import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import PipelineForm from '../../pipeline-form/PipelineForm';
import PipelineParameters from '../PipelineParameters';

const pipelineFormProps: React.ComponentProps<typeof PipelineForm> = {
  PipelineFormComponent: PipelineParameters,
  formName: 'parameters',
  obj: {},
};

describe('Pipeline details parameter tab for pipeline with empty parameters', () => {
  const obj = { metadata: { name: 'my-pipeline', namespace: 'test' } };
  const expected = { parameters: [], resources: [] };
  const plFormWrapper: ShallowWrapper = shallow(<PipelineForm {...pipelineFormProps} obj={obj} />);

  it('Should render a formik component', () => {
    expect(plFormWrapper.find('Formik').exists()).toBe(true);
  });

  it('Should render the pipeline parameters form', () => {
    const formWrapper = plFormWrapper.find('Formik').shallow();
    expect(formWrapper.find('PipelineParameters').exists()).toBe(true);
  });

  it('Should render the correct parameters', () => {
    const formWrapper = plFormWrapper.find('Formik').shallow();
    const params = formWrapper.find('PipelineParameters').prop('values');
    expect(params).toEqual(expected);
  });
});

describe('Pipeline details parameter tab for pipeline with parameters in place', () => {
  const obj = {
    metadata: { name: 'my-pipeline', namespace: 'test' },
    spec: { params: [{ name: 'test-param', description: 'apple', defult: 'apple' }] },
  };
  const expected = {
    parameters: [{ defult: 'apple', description: 'apple', name: 'test-param' }],
    resources: [],
  };
  const plFormWrapper: ShallowWrapper = shallow(<PipelineForm {...pipelineFormProps} obj={obj} />);

  it('Should render a formik component', () => {
    expect(plFormWrapper.find('Formik').exists()).toBe(true);
  });

  it('Should render the pipeline parameters form', () => {
    const formWrapper = plFormWrapper.find('Formik').shallow();
    expect(formWrapper.find('PipelineParameters').exists()).toBe(true);
  });

  it('Should render the correct parameters', () => {
    const formWrapper = plFormWrapper.find('Formik').shallow();
    const params = formWrapper.find('PipelineParameters').prop('values');
    expect(params).toEqual(expected);
  });
});
