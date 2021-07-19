import * as React from 'react';
import { Form } from '@patternfly/react-core';
import SysprepAutounattend from './sysprep-autounattend/SysprepAutounattend';
import SysprepUnattend from './sysprep-unattend/SysprepUnattend';
import SysprepInfo from './SysprepInfo';

import './sysprep.scss';

const Sysprep = () => {
  return (
    <Form className="kv-sysprep--main">
      <SysprepInfo />
      <SysprepAutounattend />
      <SysprepUnattend />
    </Form>
  );
};

export default Sysprep;
