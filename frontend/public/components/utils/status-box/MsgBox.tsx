import * as React from 'react';
import { Box } from '.';

export const MsgBox: React.FC<MsgBoxProps> = ({ title, detail, className = '' }) => (
  <Box className={className}>
    {title && (
      <div className="cos-status-box__title" data-test="msg-box-title">
        {title}
      </div>
    )}
    {detail && (
      <div className="pf-v5-u-text-align-center cos-status-box__detail" data-test="msg-box-detail">
        {detail}
      </div>
    )}
  </Box>
);
MsgBox.displayName = 'MsgBox';

type MsgBoxProps = {
  title?: string;
  detail?: React.ReactNode;
  className?: string;
};
