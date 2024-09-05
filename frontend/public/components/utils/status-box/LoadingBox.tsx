import * as React from 'react';
import { Loading } from './Loading';
import { MsgBox } from './MsgBox';

export const LoadingBox: React.FC = ({ children }) => (
  <MsgBox>
    <Loading />
    {children}
  </MsgBox>
);
LoadingBox.displayName = 'LoadingBox';
