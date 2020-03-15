import * as React from 'react';
import {
  Grid,
  GridItem,
  Text,
  TextVariants,
  Button,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { ExternalLink, resourcePath } from '@console/internal/components/utils';
import { K8sResourceKindReference } from '@console/internal/module/k8s';
import { LabelRow } from './LabelRow/label-row';
import { ADD_LABEL, LABEL_KEY, LABEL_VALUE } from './consts';
import { IDLabel } from './types';
import './labels-list.scss';

export const LabelsList = <T extends IDLabel = IDLabel>({
  labels,
  kind = '',
  onLabelAdd,
  onLabelChange,
  onLabelDelete,
  addRowText = ADD_LABEL,
  emptyStateAddRowText = ADD_LABEL,
}: LabelsListProps<T>) => (
  <>
    <Grid className="kv-labels-list__grid">
      {labels.length > 0 && [
        <React.Fragment key="label-title-row">
          <GridItem span={6}>
            <Text component={TextVariants.h4}>{LABEL_KEY}</Text>
          </GridItem>
          <GridItem span={6}>
            <Text component={TextVariants.h4}>{LABEL_VALUE}</Text>
          </GridItem>
        </React.Fragment>,
        labels.map((label) => (
          <LabelRow<T>
            key={label.id}
            label={label}
            onChange={onLabelChange}
            onDelete={onLabelDelete}
          />
        )),
      ]}
    </Grid>
    <Split className="kv-labels-list__buttons">
      <SplitItem>
        <Button
          className="pf-m-link--align-left"
          id="vm-labels-list-add-btn"
          variant="link"
          onClick={() => onLabelAdd()}
          icon={<PlusCircleIcon />}
        >
          {labels.length > 0 ? addRowText : emptyStateAddRowText}
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

type LabelsListProps<T> = {
  labels: T[];
  kind?: K8sResourceKindReference;
  newLabel?: T;
  addRowText?: string;
  emptyStateAddRowText?: string;
  onLabelAdd: () => void;
  onLabelChange: (label: T) => void;
  onLabelDelete: (id: number) => void;
};
