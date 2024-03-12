import * as React from 'react';
import { SVGProps } from 'react';

const SuccessApprovalTaskIcon: React.FC<SVGProps<SVGSVGElement>> = (props): React.ReactElement => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" fill="none" {...props}>
      <path
        fill="#3E8635"
        fillRule="evenodd"
        d="M8.002 0C3.589 0 0 3.59 0 8s3.59 8 8.002 8C12.412 16 16 12.41 16 8s-3.588-8-7.998-8Z"
        clipRule="evenodd"
      />
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M8 14c-3.31 0-6-2.69-6-6 0-3.308 2.69-6 6-6 3.308 0 6 2.69 6 6s-2.692 6-6 6Z"
        clipRule="evenodd"
      />
      <path
        fill="#3E8635"
        fillRule="evenodd"
        d="M7.854 12.375a4.52 4.52 0 1 0 0-9.042 4.52 4.52 0 0 0 0 9.042Zm-.935-2.127L5.023 8.352a.292.292 0 0 1 0-.413l.412-.412a.292.292 0 0 1 .413 0l1.277 1.277L9.86 6.07a.292.292 0 0 1 .413 0l.412.412a.292.292 0 0 1 0 .413l-3.354 3.354a.292.292 0 0 1-.412 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export default SuccessApprovalTaskIcon;
