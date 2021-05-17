import * as React from 'react';

const CriticalIcon = (props) => (
  <svg x="1.5">
    <svg viewbox="0 0 10 10" {...props}>
      <polygon points="10 10, 10 3, 5 0, 0 3, 0 10, 5 8" />
    </svg>
  </svg>
);

export default CriticalIcon;
