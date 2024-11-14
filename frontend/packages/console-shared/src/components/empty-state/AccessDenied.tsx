import * as React from 'react';
import { Alert, Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import restrictedSignImg from '@console/internal/imgs/restricted-sign.svg';
import { ConsoleEmptyState } from './ConsoleEmptyState';

const RestrictedSignIcon = () => {
  const { t } = useTranslation('console-shared');
  return <img src={restrictedSignImg} alt={t('Restricted access')} />;
};

export const AccessDenied: React.FC = ({ children }) => {
  const { t } = useTranslation('console-shared');
  return (
    <ConsoleEmptyState
      data-test="access-denied"
      Icon={RestrictedSignIcon}
      title={t('Restricted access')}
    >
      <Flex direction={{ default: 'column' }}>
        <FlexItem>{t("You don't have access to this section due to cluster policy")}</FlexItem>
        {children && (
          <FlexItem>
            <Alert variant="danger" className="pf-v5-u-text-align-left" title={t('Error details')}>
              {children}
            </Alert>
          </FlexItem>
        )}
      </Flex>
    </ConsoleEmptyState>
  );
};
AccessDenied.displayName = 'AccessDenied';
