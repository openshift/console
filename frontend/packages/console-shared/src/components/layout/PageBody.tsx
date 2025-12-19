import type { ReactNode } from 'react';
import { Flex } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';

const PageBody: Snail.FCC<PageBodyProps> = ({ children, className, ...props }) => {
  return (
    <Flex
      className={css('co-m-page__body', className)}
      direction={{ default: 'column' }}
      rowGap={{ default: 'rowGapNone' }}
      flexWrap={{ default: 'nowrap' }}
      style={{ flex: '1 0 auto' }}
      {...props}
    >
      {children}
    </Flex>
  );
};

export type PageBodyProps = {
  children: ReactNode;
  className?: string;
};

export default PageBody;
