import * as React from 'react';
import { Flex, FlexItem, Spinner } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  RedExclamationCircleIcon,
} from '@console/shared';

type ServiceIconStatusProps = {
  status: string;
};

const ServiceIconStatus: React.FC<ServiceIconStatusProps> = ({
  status,
}: ServiceIconStatusProps) => {
  const { t } = useTranslation();
  let icon;
  let text;

  switch (status) {
    case 'ready':
      icon = <GreenCheckCircleIcon />;
      text = t('rhoas-plugin~Ready');
      break;
    case 'accepted':
      icon = <YellowExclamationTriangleIcon />;
      text = t('rhoas-plugin~Creation pending');
      break;
    case 'provisioning':
    case 'preparing':
      icon = (
        <Spinner
          size="md"
          aria-label={t('rhoas-plugin~Creation in progress')}
          aria-valuetext={t('rhoas-plugin~Creation in progress')}
        />
      );
      text = t('rhoas-plugin~Creation in progress');
      break;
    case 'failed':
      icon = <RedExclamationCircleIcon />;
      text = t('rhoas-plugin~Failed');
      break;
    case 'deprovision':
      text = t('rhoas-plugin~Deletion in progress');
      break;
    default:
      icon = <YellowExclamationTriangleIcon />;
      text = t('rhoas-plugin~Creation pending');
      break;
  }

  return (
    <Flex>
      {icon && <FlexItem spacer={{ default: 'spacerSm' }}>{icon}</FlexItem>}
      <FlexItem>{text}</FlexItem>
    </Flex>
  );
};

export default ServiceIconStatus;
