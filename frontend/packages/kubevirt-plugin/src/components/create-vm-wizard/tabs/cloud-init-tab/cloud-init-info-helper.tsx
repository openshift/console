import * as React from 'react';
import { Popover, PopoverPosition, Stack, StackItem } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { ExternalLink } from '@console/internal/components/utils';
import { CLOUD_INIT_DOC_LINK } from '../../../../utils/strings';

export const CloudInitInfoHelper = () => (
  <Popover
    position={PopoverPosition.right}
    aria-label="cloud init help"
    bodyContent={
      <Stack hasGutter>
        <StackItem>
          You can use cloud-init for post installation configuration of the guest operating system.
          The guest OS needs to have the cloud-init service running.
        </StackItem>
        <StackItem>
          <div className="text-muted">
            cloud-init is already configured in cloud images of Fedora and RHEL
          </div>
        </StackItem>
        <StackItem>
          <ExternalLink text="Learn more" href={CLOUD_INIT_DOC_LINK} />
        </StackItem>
      </Stack>
    }
  >
    <button
      type="button"
      onClick={(e) => e.preventDefault()}
      className="pf-c-form__group-label-help"
      aria-label="cloud init help"
    >
      <HelpIcon noVerticalAlign />
    </button>
  </Popover>
);
