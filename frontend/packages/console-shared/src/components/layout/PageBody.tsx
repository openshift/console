import * as React from 'react';
import { Flex } from '@patternfly/react-core';

const PageBody: React.FC<PageBodyProps> = ({ children, className, ...props }) => {
  return (
    <Flex
      className={className}
      direction={{ default: 'column' }}
      style={{ flex: '1 0 auto' }}
      {...props}
    >
      {children}
    </Flex>
  );
};

export type PageBodyProps = {
  children: React.ReactNode;
  className?: string;
};

export default PageBody;
