import type { FC } from 'react';
import { useMemo } from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import type { K8sKind } from '@console/internal/module/k8s';
import { getPropertyDescription } from '@console/internal/module/k8s';

const SCROLLABLE_POPOVER_BODY_STYLE = {
  maxHeight: '300px',
  overflowY: 'auto' as const,
};

export const SchemaFieldHelp: FC<SchemaFieldHelpProps> = ({
  model,
  propertyPath,
  headerContent,
  ariaLabel,
  fallbackDescription,
}) => {
  const description = useMemo(
    () => getPropertyDescription(model, propertyPath) || fallbackDescription,
    [model, propertyPath, fallbackDescription],
  );

  if (!description) {
    return null;
  }

  return (
    <Popover
      headerContent={headerContent}
      bodyContent={
        <div style={SCROLLABLE_POPOVER_BODY_STYLE}>
          <SyncMarkdownView content={description} />
        </div>
      }
    >
      <Button variant="plain" aria-label={ariaLabel}>
        <HelpIcon />
      </Button>
    </Popover>
  );
};

type SchemaFieldHelpProps = {
  model: K8sKind;
  propertyPath: string | string[];
  headerContent: string;
  ariaLabel: string;
  fallbackDescription?: string;
};
