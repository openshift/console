import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';

type PlainListProps = {
  items: string[];
};

export const PlainList: FC<PlainListProps> = ({ items }) =>
  items ? (
    <List isPlain>
      {items.map((i) => (
        <ListItem key={i}>{i}</ListItem>
      ))}
    </List>
  ) : null;
