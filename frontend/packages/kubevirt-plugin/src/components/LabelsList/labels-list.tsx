import * as React from 'react';
import { Grid, Button, Split, SplitItem } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { ExternalLink, resourcePath } from '@console/internal/components/utils';
import { K8sResourceKindReference } from '@console/internal/module/k8s';
import { ADD_LABEL, EMPTY_ADD_LABEL } from './consts';
import './labels-list.scss';

export const LabelsList = ({
  kind = '',
  isEmpty,
  onLabelAdd,
  children,
  addRowText = ADD_LABEL,
  emptyStateAddRowText = EMPTY_ADD_LABEL,
}: LabelsListProps) => (
  <>
    <Grid className="kv-labels-list__grid">{children}</Grid>
    <Split className="kv-labels-list__buttons">
      <SplitItem>
        <Button
          className="pf-m-link--align-left"
          id="vm-labels-list-add-btn"
          variant="link"
          onClick={() => onLabelAdd()}
          icon={<PlusCircleIcon />}
        >
          {isEmpty ? emptyStateAddRowText : addRowText}
        </Button>
      </SplitItem>
      <SplitItem isFilled />
      <SplitItem>
        {kind && (
          <ExternalLink
            additionalClassName="kv-labels-list__link"
            text={<div>{`Explore ${kind} list`}</div>}
            href={resourcePath(kind)}
          />
        )}
      </SplitItem>
    </Split>
  </>
);

type LabelsListProps = {
  children: React.ReactNode;
  isEmpty: boolean;
  kind?: K8sResourceKindReference;
  addRowText?: string;
  emptyStateAddRowText?: string;
  onLabelAdd: () => void;
};
