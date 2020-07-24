import * as React from 'react';
import { shallow } from 'enzyme';
import YAMLEditor from '../YAMLEditor';

describe('YAMLEditorComponent', () => {
  it('should exist', () => {
    const wrapper = shallow(<YAMLEditor />);
    expect(wrapper.isEmptyRender()).toBe(false);
  });
});
