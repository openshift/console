import type { FC } from 'react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { MarkdownView, MarkdownProps } from '@openshift-console/plugin-shared/src';
import { ThemeContext, updateThemeClass } from './ThemeProvider';

type SyncMarkdownProps = Omit<MarkdownProps, 'theme' | 'updateThemeClass' | 'emptyMsg'> & {
  emptyMsg?: string;
  theme?: string;
};

export const SyncMarkdownView: FC<SyncMarkdownProps> = ({ emptyMsg, theme, ...rest }) => {
  const { t } = useTranslation();
  emptyMsg = emptyMsg || t('public~Not available');
  const contextTheme = useContext(ThemeContext);
  const markDownTheme = theme || contextTheme;
  return (
    <MarkdownView
      {...rest}
      emptyMsg={emptyMsg}
      theme={markDownTheme}
      updateThemeClass={updateThemeClass}
    />
  );
};
