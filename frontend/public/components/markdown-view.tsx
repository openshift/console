import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MarkdownView, MarkdownProps } from '@openshift-console/plugin-shared/src';
import { ThemeContext, updateThemeClass } from './ThemeProvider';

type SyncMarkdownProps = Omit<MarkdownProps, 'theme' | 'updateThemeClass' | 'emptyMsg'> & {
  emptyMsg?: string;
};

export const SyncMarkdownView: React.FC<SyncMarkdownProps> = ({ emptyMsg, ...rest }) => {
  const { t } = useTranslation();
  emptyMsg = emptyMsg || t('public~Not available');
  const theme = React.useContext(ThemeContext);
  return (
    <MarkdownView {...rest} emptyMsg={emptyMsg} theme={theme} updateThemeClass={updateThemeClass} />
  );
};
