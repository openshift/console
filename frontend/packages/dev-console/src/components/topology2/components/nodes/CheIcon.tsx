import * as React from 'react';

const CheIcon: React.FC<React.HTMLProps<SVGElement>> = ({ style }): React.ReactElement => {
  return (
    <svg height="1em" width="1em" version="1.1" viewBox="0 0 47 57" style={style}>
      <g fillRule="evenodd" stroke="none" strokeWidth="1" fill="none">
        <path
          d="M0.032227,30.88l-0.032227-17.087,23.853-13.793,23.796,13.784-14.691,8.51-9.062-5.109-23.864,13.695z"
          fill="#fdb940"
        />
        <path
          d="M0,43.355l23.876,13.622,23.974-13.937v-16.902l-23.974,13.506-23.876-13.506v17.217z"
          fill="#525c86"
        />
      </g>
    </svg>
  );
};

export default CheIcon;
