import * as React from 'react';
import { Button } from '@patternfly/react-core';
import CloudShellBody from './CloudShellBody';
import CloudShellDrawer from './CloudShellDrawer';

const CloudShell: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      {/* Remove this button once actual terminal is in place */}
      <Button variant="control" onClick={() => setOpen(!open)}>
        Open Drawer
      </Button>
      <CloudShellDrawer open={open} onClose={() => setOpen(false)}>
        <CloudShellBody />
      </CloudShellDrawer>
    </>
  );
};

export default CloudShell;
