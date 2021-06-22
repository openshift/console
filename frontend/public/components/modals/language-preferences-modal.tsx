import * as React from 'react';
import { useTranslation } from 'react-i18next';
import i18next, { TFunction } from 'i18next';
import { QuickStartContext } from '@patternfly/quickstarts';
import { Dropdown } from '../utils';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory/modal';

const LanguagePreferencesModal = (props: LanguagePreferencesModalProps) => {
  const { i18n, t } = useTranslation();
  const { setLng, setResourceBundle } = React.useContext(QuickStartContext);
  const supportedLocales = {
    en: 'English',
    zh: '中文',
    ko: '한국어',
    ja: '日本語',
  };
  const langOptions = Object.keys(supportedLocales).map((lang) => ({
    lang,
    value: supportedLocales[lang],
  }));
  const initLang =
    localStorage.getItem('bridge/language') ||
    // handles languages we support, languages we don't support, and subsets of languages we support (such as en-us, zh-cn, etc.)
    i18next.languages.find((lang) => langOptions.some((langOption) => langOption.lang === lang));
  const [language, setLanguage] = React.useState(initLang);
  const { close } = props;
  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    i18n.changeLanguage(language ? language : 'en');
    localStorage.setItem('bridge/language', language);
    const resourceBundle = i18n.getResourceBundle(language || 'en', 'quickstart');
    setLng(language || 'en');
    setResourceBundle(resourceBundle);
    close();
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('public~Edit language preference')}</ModalTitle>
      <ModalBody>
        <div className="form-group">
          <label htmlFor="language_dropdown">{t('public~Language')}</label>
          <Dropdown
            id="language_dropdown"
            items={supportedLocales}
            onChange={(newLanguage: string) => setLanguage(newLanguage)}
            selectedKey={language}
            title={t('public~Select language')}
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('public~Save')}
        cancelText={t('public~Cancel')}
        cancel={close}
        inProgress={false}
      />
    </form>
  );
};

export const languagePreferencesModal = createModalLauncher(LanguagePreferencesModal);

type LanguagePreferencesModalProps = {
  t: TFunction;
} & ModalComponentProps;
