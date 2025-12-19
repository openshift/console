import * as React from 'react';
import { List, ListItem } from '@patternfly/react-core';

const PlainList: Snail.FCC<PlainListProps> = ({ items }) =>
  items ? (
    <List isPlain>
      {items.map((i) => (
        <ListItem key={i}>{i}</ListItem>
      ))}
    </List>
  ) : null;

type PlainListProps = {
  items: string[];
};

export default PlainList;
