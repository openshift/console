import * as React from 'react';
import {
  Select, 
  SelectOption,
  SelectOptionObject
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

const { SUPPORTED_LOCALES } = require('../../i18next-parser.config');

export const LangSelector: React.FunctionComponent = () => {
  const { i18n } = useTranslation();
  const langOptions = Object.keys(SUPPORTED_LOCALES).map(lang => ({ lang, value: SUPPORTED_LOCALES[lang]}));
  const initLang = langOptions.find(lang => lang.lang === i18n.language);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selected, setSelected] = React.useState(initLang ? initLang.value : '');

  return (
    <Select
      aria-label="Select language"
      onToggle={(expanded: boolean) => setIsExpanded(expanded)}
      onSelect={(event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
        setSelected(value as string); 
        setIsExpanded(false);
        const match = langOptions.find((option) => option.value === value);
        moment.locale(match ? match.lang : 'en');
        i18n.changeLanguage(match ? match.lang : 'en');
      }}
      selections={selected}
      isExpanded={isExpanded}
    >
      {langOptions.map((option, index) => (
        <SelectOption
          key={index}
          value={option.value}
        />
      ))}
    </Select>
  );
}
