import * as React from 'react';

const PacIcon: React.FC<React.HTMLProps<SVGElement>> = (): React.ReactElement => {
  return (
    <svg
      fill="currentColor"
      height="1em"
      width="1em"
      viewBox="0 0 100 100"
      transform="translate(0 .738)"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <mask maskUnits="userSpaceOnUse" id="a">
          <circle
            className="cls-1"
            cx={44.262}
            cy={49.293}
            r={50}
            style={{
              fill: '#fff',
            }}
          />
          <path
            d="M49.148 21.803c-15.485 0-28.05 12.563-28.05 28.049 0 15.485 12.565 28.05 28.05 28.05 15.486 0 28.05-12.565 28.05-28.05 0-15.486-12.564-28.05-28.05-28.05zm0 1c14.946 0 27.05 12.103 27.05 27.049 0 14.945-12.104 27.05-27.05 27.05-14.945 0-27.05-12.105-27.05-27.05 0-14.946 12.105-27.05 27.05-27.05z"
            transform="translate(-4.897 -.738)"
            fill="var(--pf-global--BackgroundColor--dark-100)"
          />
          <path
            transform="translate(-5.748 -.885)"
            d="m70.48 26.04-5.82 5.45 7.63 2.32zM26.04 29.52l5.45 5.82 2.32-7.63zM29.52 73.96l5.82-5.45-7.63-2.32zM73.96 70.48l-5.45-5.82-2.32 7.63z"
            fill="var(--pf-global--BackgroundColor--dark-100)"
          />
          <path
            d="M44.008 27.782a7.28 7.28 0 1 1 10.31 0 7.16 7.16 0 0 1-10.31 0M44.008 82.512a7.28 7.28 0 1 1 10.31 0 7.17 7.17 0 0 1-10.31 0M16.458 54.962a7.27 7.27 0 1 1 10.3 0 7.16 7.16 0 0 1-10.3 0M71.558 54.962a7.27 7.27 0 1 1 10.3 0 7.16 7.16 0 0 1-10.3 0"
            fill="var(--pf-global--BackgroundColor--dark-100)"
            transform="translate(-4.897 -.738)"
          />
        </mask>
      </defs>
      <path mask="url(#a)" transform="translate(5.738 .707)" d="M-5.738-.707h100v100h-100z" />
    </svg>
  );
};

export default PacIcon;
