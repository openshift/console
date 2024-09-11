import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as restrictedSignImg from '../../../imgs/restricted-sign.svg';
import { Alert, Flex, FlexItem } from '@patternfly/react-core';
import { ConsoleEmptyState } from './ConsoleEmptyState';

const RestrictedSignIcon = () => (
  <img className="cos-status-box__access-denied-icon" src={restrictedSignImg} />
);

export const AccessDenied: React.FC = ({ children }) => {
  const { t } = useTranslation();
  return (
    <ConsoleEmptyState
      data-test="access-denied"
      Icon={RestrictedSignIcon}
      title={t('public~Restricted access')}
    >
      <Flex direction={{ default: 'column' }}>
        <FlexItem>
          {t("public~You don't have access to this section due to cluster policy")}
        </FlexItem>
        {children && (
          <FlexItem>
            <Alert
              variant="danger"
              className="pf-v5-u-text-align-left"
              title={t('public~Error details')}
            >
              {children}
            </Alert>
          </FlexItem>
        )}
      </Flex>
    </ConsoleEmptyState>
  );
};
AccessDenied.displayName = 'AccessDenied';
