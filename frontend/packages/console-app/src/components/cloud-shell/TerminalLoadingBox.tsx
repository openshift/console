import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils/status-box';

type TerminalLoadingBoxProps = {
  message?: string;
};

const TerminalLoadingBox: React.FC<TerminalLoadingBoxProps> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <LoadingBox
      message={message ?? t('cloudshell~Connecting to your OpenShift command line terminal ...')}
    />
  );
};

export default TerminalLoadingBox;
