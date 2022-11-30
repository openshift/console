import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import i18n from 'i18next';
import { setI18n, Trans, useTranslation } from 'react-i18next';
import ProgressiveListFooter from '../ProgressiveListFooter';

const Footer = ({ children }) => {
  const { t } = useTranslation();
  return (
    <Trans
      t={t}
      ns="console-shared"
      defaults="Click on the names to access advanced options for <0></0>."
      components={[children]}
    />
  );
};

beforeEach(() => {
  i18n.services.interpolator = {
    init: () => undefined,
    reset: () => undefined,
    resetRegExp: () => undefined,
    interpolate: (str: string) => str,
    nest: (str: string) => str,
  };
  setI18n(i18n);
});

describe(ProgressiveListFooter.name, () => {
  it('should return JSX element if items array is not empty', () => {
    const wrapper = shallow(
      <ProgressiveListFooter Footer={Footer} items={['Foo']} onShowItem={() => {}} />,
    );
    expect(wrapper.find(Button).length).toEqual(1);
  });

  it('should return null if items array is empty', () => {
    const wrapper = shallow(
      <ProgressiveListFooter Footer={Footer} items={[]} onShowItem={() => {}} />,
    );
    expect(wrapper.find(Button).length).toEqual(0);
  });

  it('should generate correct text', () => {
    const wrapper = shallow(
      <ProgressiveListFooter Footer={Footer} items={['Foo', 'Bar', 'One']} onShowItem={() => {}} />,
    );
    expect(wrapper.render().text()).toEqual(
      'Click on the names to access advanced options for Foo, Bar, and One.',
    );
  });

  it('should have number of button equals to items in array', () => {
    const wrapper = shallow(
      <ProgressiveListFooter Footer={Footer} items={['Foo', 'Bar', 'One']} onShowItem={() => {}} />,
    );
    expect(wrapper.find(Button).length).toEqual(3);
  });
});
