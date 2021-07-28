import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Popover, PopoverProps, List, ListItem } from '@patternfly/react-core';
import { ResourceLink } from '@console/internal/components/utils';

import { referenceFor, K8sKind } from '@console/internal/module/k8s';

export const PopoverHelper: React.FC<PopoverHelperProps> = ({
  names,
  text,
  kind,
  popoverHasAutoWidth,
  testId,
}) => {
  const { t } = useTranslation();

  const popOverBody = (
    <List isPlain>
      {names.map((scName) => (
        <ListItem>
          <ResourceLink kind={referenceFor(kind)} name={scName} />
        </ListItem>
      ))}
    </List>
  );

  return (
    <>
      {names.length ? (
        names.length > 1 ? (
          <Popover
            aria-label={t('ceph-storage-plugin~Help')}
            bodyContent={popOverBody}
            hasAutoWidth={popoverHasAutoWidth}
          >
            <Button
              aria-label={t('ceph-storage-plugin~Help')}
              variant="link"
              isInline
              data-test-id={testId || null}
            >
              {`${names.length} ${text}`}
            </Button>
          </Popover>
        ) : (
          <ResourceLink kind={referenceFor(kind)} name={names[0]} />
        )
      ) : (
        '-'
      )}
    </>
  );
};

type PopoverHelperProps = {
  names: string[];
  text: string;
  kind: K8sKind;
  popoverHasAutoWidth?: PopoverProps['hasAutoWidth'];
  testId?: string;
};
