import * as React from 'react';
import { shallow } from 'enzyme';
import { NameValueEditor } from '../../../public/components/utils/name-value-editor';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    withTranslation: () => (Component) => {
      Component.defaultProps = { ...Component.defaultProps, t: (s) => s };
      return Component;
    },
  };
});

describe('Name Value Editor', () => {
  describe('When supplied with attributes nameString and valueString', () => {
    it('renders header correctly', () => {
      const wrapper = shallow(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          nameString={'foo'}
          valueString={'bar'}
          t={(key) => key}
        />,
      );

      expect(wrapper.html()).toContain('foo');
      expect(wrapper.html()).toContain('bar');
    });
  });

  describe('When supplied with nameValuePairs', () => {
    it('renders PairElement correctly', () => {
      const wrapper = shallow(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          t={(key) => key}
        />,
      );

      expect(wrapper.html()).toContain('value="name"');
      expect(wrapper.html()).toContain('value="value"');
    });
  });

  describe('When readOnly attribute is "true"', () => {
    it('does not render add button', () => {
      const wrapper = shallow(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          readOnly={true}
          t={(key) => key}
        />,
      );

      expect(wrapper.html()).not.toContain('pairs-list__add-icon');
    });

    it('does not render PairElement buttons', () => {
      const wrapper = shallow(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          readOnly={true}
          t={(key) => key}
        />,
      );
      expect(wrapper.html()).not.toContain('pairs-list__delete-icon');
      expect(wrapper.html()).not.toContain('pairs-list__action-icon--reorder');
    });
  });

  describe('When readOnly attribute is "false"', () => {
    it('renders add button', () => {
      const wrapper = shallow(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          readOnly={false}
          allowSorting={true}
          t={(key) => key}
        />,
      );

      expect(wrapper.html()).toContain('pairs-list__add-icon');
    });
  });

  describe('When readOnly attribute is "false" and allowSorting is "true"', () => {
    it('renders PairElement buttons correctly', () => {
      const wrapper = shallow(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          readOnly={false}
          allowSorting={true}
          t={(key) => key}
        />,
      );

      expect(wrapper.html()).toContain('pairs-list__delete-icon');
      expect(wrapper.html()).toContain('pairs-list__action-icon--reorder');
    });
  });

  describe('When allowSorting attribute is "false"', () => {
    it('renders PairElement buttons correctly', () => {
      const wrapper = shallow(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          allowSorting={false}
          t={(key) => key}
        />,
      );
      expect(wrapper.html()).toContain('pairs-list__delete-icon');
      expect(wrapper.html()).not.toContain('pairs-list__action-icon--reorder');
    });
  });
});
