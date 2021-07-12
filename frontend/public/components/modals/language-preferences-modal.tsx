import * as React from 'react';
import { useTranslation } from 'react-i18next';
import i18next, { TFunction } from 'i18next';
import { QuickStartContextValues } from '@patternfly/quickstarts';
import { Dropdown } from '../utils';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory/modal';
import { getProcessedResourceBundle } from '@console/app/src/components/quick-starts/utils/quick-start-context';

const LanguagePreferencesModal = (props: LanguagePreferencesModalProps) => {
  const { i18n, t } = useTranslation();
  const { setResourceBundle } = props.quickStartContext;

  React.useEffect(() => {
    const onLanguageChange = (lng) => {
      // Update language resource of quick starts components
      const resourceBundle = i18n.getResourceBundle(lng, 'console-app');
      const processedBundle = getProcessedResourceBundle(resourceBundle, lng);
      setResourceBundle(processedBundle, lng);
    };
    i18n.on('languageChanged', onLanguageChange);

    return () => {
      i18n.off('languageChanged', onLanguageChange);
    };
  });

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
  quickStartContext: QuickStartContextValues;
} & ModalComponentProps;
