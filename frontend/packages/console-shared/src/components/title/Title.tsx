import { Helmet } from 'react-helmet-async';
import { TitleProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

/**
 * A component to change the document title of the page.
 */
export const Title: React.FCC<TitleProps> = ({ children, ...props }) => {
  return (
    <Helmet>
      <title {...props}>{String(children)}</title>
    </Helmet>
  );
};
