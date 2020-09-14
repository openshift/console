import * as React from 'react';
import { Alert, AlertVariant, ExpandableSection } from '@patternfly/react-core';
import * as classNames from 'classnames';

import './errors.scss';

export type Error = {
  message?: React.ReactNode;
  detail?: React.ReactNode;
  variant?: AlertVariant;
  title: React.ReactNode;
  key?: string;
};

type ErrorsProps = {
  errors: Error[];
  endMargin?: boolean;
};

export const Errors: React.FC<ErrorsProps> = ({ errors, endMargin }) => {
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
              className={classNames({
                'kubevirt-errors__error-group--item': idx !== arr.length - 1,
                'kubevirt-errors__error-group--end ': endMargin && idx === arr.length - 1,
              })}
            >
              {!detail && message}
              {detail && (
                <div>
                  <div className="kubevirt-errors__detailed-message">{message}</div>
                  <ExpandableSection
                    toggleTextCollapsed="View details"
                    toggleTextExpanded="Hide details"
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
