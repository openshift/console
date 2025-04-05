import { Link, LinkProps } from 'react-router-dom-v5-compat';

/**
 * A helper which creates a `Link` component that **only**
 * links to a specific location in the console.
 *
 * This is needed to bypass PatternFly `DropdownItem`
 * forcing the `to` prop to pass as `href`, which breaks
 * `react-router-dom` routing and causes a hard reload.
 *
 * @param href - The location to link to.
 * @param extraLinkProps - Any additional props to pass to the `Link` component.
 * @returns A component that links to the specified location.
 */
export const LinkTo = (href: string, extraLinkProps?: Partial<LinkProps>) => (props: LinkProps) => (
  <Link {...props} to={href} {...extraLinkProps} />
);
