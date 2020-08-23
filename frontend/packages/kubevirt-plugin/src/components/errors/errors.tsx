import * as React from 'react';
import { Alert, AlertVariant, ExpandableSection } from '@patternfly/react-core';
import * as classNames from 'classnames';
import { formatError } from '../create-vm-wizard/error-components/utils';

import './errors.scss';

export type Error = {
  message?: string;
  variant?: AlertVariant;
  title: string;
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
        errors.map(({ message, key, title, variant }, idx, arr) => {
          const { isLong, errTitle, description } = formatError(title, message);

          return (
            <Alert
              isInline
              key={key || idx}
              variant={variant || AlertVariant.danger}
              title={errTitle}
              className={classNames({
                'kubevirt-errors__error-group--item': idx !== arr.length - 1,
                'kubevirt-errors__error-group--end ': endMargin && idx === arr.length - 1,
              })}
            >
              {!isLong && message}
              {isLong && (
                <div>
                  {description && <div className="kubevirt-errors__description">{description}</div>}
                  <ExpandableSection
                    toggleTextCollapsed="View details"
                    toggleTextExpanded="Hide details"
                  >
                    <pre className="kubevirt-errors__expendable">{message}</pre>
                  </ExpandableSection>
                </div>
              )}
            </Alert>
          );
        })}
    </>
  );
};
