import * as React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { StatusIconAndText } from '@console/dynamic-plugin-sdk';

const LinkStatus: React.FC<LinkStatusProps> = ({ linkTitle, linkTo, ...other }) =>
  linkTo ? (
    <Link to={linkTo} title={linkTitle}>
      <StatusIconAndText {...other} />
    </Link>
  ) : (
    <StatusIconAndText {...other} />
  );

type LinkStatusProps = React.ComponentProps<typeof StatusIconAndText> & {
  linkTitle?: string;
  linkTo?: LinkProps['to'];
};

export default LinkStatus;
