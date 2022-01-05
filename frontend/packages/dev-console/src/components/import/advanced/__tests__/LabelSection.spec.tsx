import * as React from 'react';
import { shallow } from 'enzyme';
import SelectorInputField from '@console/shared/src/components/formik-fields/SelectorInputField';
import FormSection from '../../section/FormSection';
import LabelSection from '../LabelSection';

describe('LabelSection', () => {
  it('should render a form section', () => {
    const component = shallow(<LabelSection />);
    expect(component.find(FormSection).exists()).toBe(true);

    const formSection = component.find(FormSection).first();
    expect(formSection.props().title).toBe('Labels');
    expect(formSection.props().subTitle).toBe('Each label is applied to each created resource.');
  });

  it('should render an input field', () => {
    const component = shallow(<LabelSection />);
    expect(component.find(FormSection).exists()).toBe(true);

    const inputField = component.find(SelectorInputField).first();
    expect(inputField.props().name).toBe('labels');
    expect(inputField.props().placeholder).toBe('app.io/type=frontend');
  });
});
