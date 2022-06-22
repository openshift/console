import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CopyToClipboard } from '@console/internal/components/utils/copy-to-clipboard';
import { ErrorBoundaryFallbackProps } from '../types';

const ErrorDetailsBlock: React.FC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <h3 className="co-section-heading-tertiary">{props.title}</h3>
      <div className="form-group">
        <label htmlFor="description">{t('console-shared~Description:')}</label>
        <p>{props.errorMessage}</p>
      </div>
      <div className="form-group">
        <label htmlFor="componentTrace">{t('console-shared~Component trace:')}</label>
        <div className="co-copy-to-clipboard__stacktrace-width-height">
          <CopyToClipboard value={props.componentStack.trim()} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="stackTrace">{t('console-shared~Stack trace:')}</label>
        <div className="co-copy-to-clipboard__stacktrace-width-height">
          <CopyToClipboard value={props.stack.trim()} />
        </div>
      </div>
    </>
  );
};

export default ErrorDetailsBlock;
