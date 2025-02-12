import * as React from 'react';
import { List, ListItem } from '@patternfly/react-core';

export const PlainList: React.FCC<PlainListProps> = ({ items }) => (
  <List isPlain>
    {items.map((i) => (
      <ListItem>{i}</ListItem>
    ))}
  </List>
);

type PlainListProps = {
  items: (string | React.ReactElement)[];
};
