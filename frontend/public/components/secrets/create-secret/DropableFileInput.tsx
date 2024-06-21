import * as React from 'react';
import { AsyncComponent } from '../../utils/async';

//TODO :Create a shared LazyDroppableFileInput component.
export const DroppableFileInput = (props) => (
  <AsyncComponent
    loader={() => import('../../utils/file-input').then((c) => c.DroppableFileInput)}
    {...props}
  />
);
