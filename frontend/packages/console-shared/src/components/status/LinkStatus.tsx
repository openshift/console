import type { FC, ComponentProps } from 'react';
import type { To } from 'react-router';
import { Link } from 'react-router';
import { StatusIconAndText } from '@console/dynamic-plugin-sdk';

const LinkStatus: FC<LinkStatusProps> = ({ linkTitle, linkTo, ...other }) =>
  linkTo ? (
    <Link to={linkTo} title={linkTitle}>
      <StatusIconAndText {...other} />
    </Link>
  ) : (
    <StatusIconAndText {...other} />
  );

type LinkStatusProps = ComponentProps<typeof StatusIconAndText> & {
  linkTitle?: string;
  linkTo?: To;
};

export default LinkStatus;
