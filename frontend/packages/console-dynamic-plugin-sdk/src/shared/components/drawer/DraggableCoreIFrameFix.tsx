import * as React from 'react';
import { DraggableCore, DraggableEvent, DraggableData } from 'react-draggable';

import './DraggableCoreIFrameFix.scss';

const DraggableCoreIFrameFix: React.FC<React.ComponentProps<typeof DraggableCore>> = ({
  onStart,
  onStop,
  ...other
}) => {
  const onStartFn =
    // rule is inconsistent with typescript return type
    // eslint-disable-next-line consistent-return
    (e: DraggableEvent, data: DraggableData): false | void => {
      document.body.classList.add('ocs-draggable-core-iframe-fix');
      if (onStart) {
        return onStart(e, data);
      }
    };

  const onStopFn =
    // rule is inconsistent with typescript return type
    // eslint-disable-next-line consistent-return
    (e: DraggableEvent, data: DraggableData): false | void => {
      document.body.classList.remove('ocs-draggable-core-iframe-fix');
      if (onStop) {
        return onStop(e, data);
      }
    };

  return <DraggableCore {...other} onStart={onStartFn} onStop={onStopFn} />;
};

export default DraggableCoreIFrameFix;
