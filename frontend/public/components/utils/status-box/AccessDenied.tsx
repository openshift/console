import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';
import * as restrictedSignImg from '../../../imgs/restricted-sign.svg';
import { Box } from './Box';
import { MsgBox } from './MsgBox';

export const AccessDenied: React.FC<AccessDeniedProps> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div>
      <Box className="pf-v5-u-text-align-center">
        <img className="cos-status-box__access-denied-icon" src={restrictedSignImg} />
        <MsgBox
          title={t('public~Restricted Access')}
          detail={t("public~You don't have access to this section due to cluster policy.")}
        />
      </Box>
      {_.isString(message) && (
        <Alert isInline className="co-alert" variant="danger" title={t('public~Error details')}>
          {message}
        </Alert>
      )}
    </div>
  );
};
AccessDenied.displayName = 'AccessDenied';

type AccessDeniedProps = {
  message?: string;
};
