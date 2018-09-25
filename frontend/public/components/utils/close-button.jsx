import * as React from 'react';

export const CloseButton = ({onClick}) =>
  <button aria-label="Close" className="close" onClick={onClick} type="button">
    <span aria-hidden="true" className="pficon pficon-close"></span>
  </button>;
