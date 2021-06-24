import * as React from 'react';
import { Form } from '@patternfly/react-core';
import SysprepAutoUnattended from './sysprep-auto-unattended/SysprepAutoUnattended';
import SysprepUnattended from './sysprep-unattended/SysprepUnattended';

import './sysprep.scss';

const Sysprep = () => {
  return (
    <Form>
      <SysprepAutoUnattended />
      <SysprepUnattended />
    </Form>
  );
};

export default Sysprep;
