import * as React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import './SubnetHelperText.scss';

const SubnetsHelperText: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="kv-subnets-container">
      <InfoCircleIcon className="kv-subnets-container__info-icon" />
      <span className="kv-subnets-container__helper-text">
        {t(
          'network-attachment-definition-plugin~Assigns IP addresses from this subnet to Pods and VirtualMachines.',
        )}
      </span>
    </div>
  );
};

export default SubnetsHelperText;
