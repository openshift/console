import * as i18nextMocks from './i18next';
import * as React from 'react';

export const useTranslation = () => {
  return {
    t: i18nextMocks.t,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  };
};

export const withTranslation = () => (component) => (props) =>
  React.createElement(component, { ...props, t: i18nextMocks.t });

export const Trans = (children) => children.children;
