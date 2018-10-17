import * as React from 'react';
import { shallow } from 'enzyme';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import { NameValueEditor } from '../../../public/components/utils/name-value-editor';

describe(NameValueEditor.displayName, () => {

  const Editor = DragDropContext(HTML5Backend)(NameValueEditor);

  describe('When supplied with attributes nameString and valueString', () => {
    it('renders header correctly', () => {
      const wrapper = shallow(
        <Editor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={()=>{}}
          nameString={'foo'}
          valueString={'bar'}
        />
      );

      expect(wrapper.html()).toContain('foo');
      expect(wrapper.html()).toContain('bar');
    });
  });

  describe('When supplied with nameValuePairs', () => {
    it('renders PairElement correctly', () => {
      const wrapper = shallow(
        <Editor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={()=>{}}
        />
      );

      expect(wrapper.html()).toContain('value="name"');
      expect(wrapper.html()).toContain('value="value"');
    });
  });

  describe('When readOnly attribute is "true"', () => {
    it('does not render add button', () => {
      const wrapper = shallow(
        <Editor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={()=>{}}
          readOnly={true}
        />
      );

      expect(wrapper.html()).not.toContain('pairs-list__add-icon');
    });

    it('does not render PairElement buttons', () => {
      const wrapper = shallow(
        <Editor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={()=>{}}
          readOnly={true}
        />
      );
      expect(wrapper.html()).not.toContain('pairs-list__delete-icon');
      expect(wrapper.html()).not.toContain('pairs-list__action-icon--reorder');
    });
  });

  describe('When readOnly attribute is "false"', () => {
    it('renders add button', () => {
      const wrapper = shallow(
        <Editor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={()=>{}}
          readOnly={false}
          allowSorting={true}
        />
      );

      expect(wrapper.html()).toContain('pairs-list__add-icon');
    });
  });

  describe('When readOnly attribute is "false" and allowSorting is "true"', () => {
    it('renders PairElement buttons correctly', () => {
      const wrapper = shallow(
        <Editor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={()=>{}}
          readOnly={false}
          allowSorting={true}
        />
      );

      expect(wrapper.html()).toContain('pairs-list__delete-icon');
      expect(wrapper.html()).toContain('pairs-list__action-icon--reorder');
    });
  });

  describe('When allowSorting attribute is "false"', () => {
    it('renders PairElement buttons correctly', () => {
      const wrapper = shallow(
        <Editor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={()=>{}}
          allowSorting={false}
        />
      );
      expect(wrapper.html()).toContain('pairs-list__delete-icon');
      expect(wrapper.html()).not.toContain('pairs-list__action-icon--reorder');
    });
  });
});
