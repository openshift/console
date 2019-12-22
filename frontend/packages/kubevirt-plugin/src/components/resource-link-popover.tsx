import * as React from 'react';
import { Popover, Button, Text } from '@patternfly/react-core';
import { ArrowIcon } from '@patternfly/react-icons';
import { resourcePath } from '@console/internal/components/utils';

import './resource-link-popover.scss';

export const ResourceLinkPopover: React.FC<ResourceLinkPopoverProps> = ({
  kind,
  name,
  namespace,
  className,
  isDisabled,
  message,
  linkMessage,
  children,
}) => (
  <Popover
    headerContent={name}
    bodyContent={children}
    position="right"
    footerContent={
      linkMessage && (
        <Button variant="link" component="a" href={resourcePath(kind, name, namespace)} isInline>
          {linkMessage} <ArrowIcon />
        </Button>
      )
    }
  >
    <Text
      className={
        isDisabled
          ? `${className} kubevirt-resource-link-popover kubevirt-resource-link-popover__disabled`
          : `${className} kubevirt-resource-link-popover`
      }
    >
      {message}
    </Text>
  </Popover>
);

export type ResourceLinkPopoverProps = {
  kind?: string;
  name: string;
  namespace: string;
  className?: string;
  isDisabled?: boolean;
  message: string;
  linkMessage?: string;
  children: React.ReactNode;
};
