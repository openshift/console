import * as i18nextMocks from './i18next';

export const useTranslation = () => {
  return {
    t: i18nextMocks.t,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  };
};

export const withTranslation = () => (Component) => {
  Component.defaultProps = { ...Component.defaultProps, t: () => '' };
  return Component;
};
