import * as React from 'react';
import { Alert, AlertVariant, ExpandableSection } from '@patternfly/react-core';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';

import './errors.scss';

export type Error = {
  message?: React.ReactNode;
  detail?: React.ReactNode;
  variant?: AlertVariant;
  title: React.ReactNode;
  key?: string;
};

type ErrorsProps = {
  errors?: Error[];
  endMargin?: boolean;
};

export const Errors: React.FC<ErrorsProps> = ({ errors, endMargin }) => {
  const { t } = useTranslation();
  return (
    <>
      {errors &&
        errors.map(({ message, key, title, detail, variant }, idx, arr) => {
          return (
            <Alert
              isInline
              key={key || idx}
              variant={variant || AlertVariant.danger}
              title={title}
              className={classnames({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'kubevirt-errors__error-group--item': idx !== arr.length - 1,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'kubevirt-errors__error-group--end ': endMargin && idx === arr.length - 1,
              })}
            >
              {!detail && message}
              {detail && (
                <div>
                  <div className="kubevirt-errors__detailed-message">{message}</div>
                  <ExpandableSection
                    toggleTextCollapsed={t('kubevirt-plugin~View details')}
                    toggleTextExpanded={t('kubevirt-plugin~Hide details')}
                  >
                    <pre className="kubevirt-errors__expendable">{detail}</pre>
                  </ExpandableSection>
                </div>
              )}
            </Alert>
          );
        })}
    </>
  );
};
