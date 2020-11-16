import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

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
  const supportedLocales = {
    en: 'English',
    ja: '日本語',
  };
  const langOptions = Object.keys(supportedLocales).map((lang) => ({
    lang,
    value: supportedLocales[lang],
  }));
  const initLang =
    localStorage.getItem('bridge/language') ||
    langOptions.find((lang) => lang.lang === i18n.language)?.lang;
  const [language, setLanguage] = React.useState(initLang);
  const { close } = props;
  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    i18n.changeLanguage(language ? language : 'en');
    localStorage.setItem('bridge/language', language);
    close();
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('language-preferences-modal~Edit language preferences')}</ModalTitle>
      <ModalBody>
        <p>
          {t(
            'language-preferences-modal~All interface content will appear in your selected language.',
          )}
        </p>
        <div className="form-group">
          <label htmlFor="language_dropdown">{t('language-preferences-modal~Language')}</label>
          <Dropdown
            id="language_dropdown"
            items={supportedLocales}
            onChange={(newLanguage: string) => setLanguage(newLanguage)}
            selectedKey={language}
            title={t('language-preferences-modal~Select language')}
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
