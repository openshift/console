import * as React from 'react';
import * as classNames from 'classnames';
import { Box, Loading } from '.';

export const LoadingBox: React.FC<LoadingBoxProps> = ({ className, message }) => (
  <Box className={classNames('cos-status-box--loading', className)}>
    <Loading />
    {message && <div className="cos-status-box__loading-message">{message}</div>}
  </Box>
);
LoadingBox.displayName = 'LoadingBox';

type LoadingBoxProps = {
  className?: string;
  message?: string;
};
