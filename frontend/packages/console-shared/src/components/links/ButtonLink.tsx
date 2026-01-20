import type { FC } from 'react';
import { Button, ButtonProps } from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom-v5-compat';

type ButtonLinkProps = Omit<ButtonProps, 'component' | 'href'> & {
  /** Equivalent to the `to` prop of the `react-router` `Link` component. */
  href: string;
};

/**
 * A PatternFly Button that integrates with `react-router` to create
 * a link to a specific location in the console.
 */
export const ButtonLink: FC<ButtonLinkProps> = (props) => {
  const navigate = useNavigate();

  return (
    <Button
      {...props}
      onClick={(e) => {
        e.preventDefault();
        navigate(props.href);
        props?.onClick?.(e);
      }}
    />
  );
};
