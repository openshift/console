import * as React from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';

export const FooCard: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Foo Card</CardTitle>
    </CardHeader>
    <CardBody>
      <div>foo content</div>
    </CardBody>
  </Card>
);
