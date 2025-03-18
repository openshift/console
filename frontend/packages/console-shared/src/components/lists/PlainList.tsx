import * as React from 'react';
import { List, ListItem } from '@patternfly/react-core';

export const PlainList: React.FCC<PlainListProps> = ({ items }) =>
  items ? (
    <List isPlain>
      {items.map((i) => (
        <ListItem key={i.toString()}>{i}</ListItem>
      ))}
    </List>
  ) : null;

type PlainListProps = {
  items: (string | React.ReactElement)[];
};
