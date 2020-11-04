import * as React from 'react';
import {
  Alert,
  Popover,
  PopoverPosition,
  Text,
  TextVariants,
  Button,
  Stack,
  StackItem,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import {
  ResourceLink,
  ExternalLink,
  resourcePath,
  pluralize,
} from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { getName, Status } from '@console/shared';
import {
  SCHEDULING_NODES_MATCH_TEXT,
  SCHEDULING_WITH_PREFERRED_NODES_MATCH_TEXT,
  SCHEDULING_NO_NODES_MATCH_TEXT,
  SCHEDULING_NODES_MATCH_BUTTON_TEXT,
  SCHEDULING_NO_NODES_MATCH_BUTTON_TEXT,
} from '../consts';
import './node-checker.scss';

export const NodeChecker: React.FC<NodeCheckerProps> = ({
  qualifiedNodes,
  qualifiedPerferredNodes,
  wariningTitle,
  warningMessage,
}) => {
  const qualifiedNodesSize = qualifiedNodes.length;
  const buttonText = pluralize(qualifiedNodesSize, 'Node');
  const preferredNodes = new Set(qualifiedPerferredNodes?.map((node) => getName(node)));

  return (
    <Alert
      className="kv-node-checker"
      variant={
        qualifiedNodesSize > 0 || qualifiedPerferredNodes?.length > 0 ? 'success' : 'warning'
      }
      isInline
      title={
        qualifiedNodesSize > 0
          ? qualifiedPerferredNodes?.length > 0
            ? SCHEDULING_WITH_PREFERRED_NODES_MATCH_TEXT(
                qualifiedNodesSize,
                qualifiedNodesSize < qualifiedPerferredNodes.length
                  ? qualifiedNodesSize
                  : qualifiedPerferredNodes.length,
              )
            : SCHEDULING_NODES_MATCH_TEXT(qualifiedNodesSize)
          : qualifiedPerferredNodes?.length > 0
          ? SCHEDULING_NODES_MATCH_TEXT(qualifiedPerferredNodes?.length)
          : wariningTitle || SCHEDULING_NO_NODES_MATCH_TEXT
      }
    >
      <Stack>
        <StackItem>
          <Popover
            headerContent={<div>{buttonText} found</div>}
            position={PopoverPosition.right}
            className="kv-node-checker__popover"
            bodyContent={
              qualifiedNodesSize > 0
                ? qualifiedNodes
                    .sort((a) => (preferredNodes.has(getName(a)) ? -1 : 1))
                    .map((node) => (
                      <Split key={getName(node)}>
                        <ExternalLink
                          href={resourcePath('Node', getName(node))}
                          text={<ResourceLink linkTo={false} kind="Node" name={getName(node)} />}
                        />
                        <SplitItem isFilled className="kv-node-checker__preferred-status">
                          {preferredNodes.has(getName(node)) && <Status status="Preferred" />}
                        </SplitItem>
                      </Split>
                    ))
                : qualifiedPerferredNodes?.map((node) => (
                    <Split key={getName(node)}>
                      <ExternalLink
                        href={resourcePath('Node', getName(node))}
                        text={<ResourceLink linkTo={false} kind="Node" name={getName(node)} />}
                      />
                      <SplitItem isFilled className="kv-node-checker__preferred-status">
                        {preferredNodes.has(getName(node)) && <Status status="Preferred" />}
                      </SplitItem>
                    </Split>
                  ))
            }
          >
            <Button
              isInline
              isDisabled={
                qualifiedNodesSize === 0 &&
                (!qualifiedPerferredNodes || qualifiedPerferredNodes?.length === 0)
              }
              variant="link"
            >
              <Text component={TextVariants.h4}>
                {qualifiedNodesSize > 0
                  ? SCHEDULING_NODES_MATCH_BUTTON_TEXT(qualifiedNodesSize)
                  : qualifiedPerferredNodes?.length > 0
                  ? SCHEDULING_NODES_MATCH_TEXT(qualifiedPerferredNodes?.length)
                  : warningMessage || SCHEDULING_NO_NODES_MATCH_BUTTON_TEXT}
              </Text>
            </Button>
          </Popover>
        </StackItem>
      </Stack>
    </Alert>
  );
};

type NodeCheckerProps = {
  qualifiedNodes: NodeKind[];
  qualifiedPerferredNodes?: NodeKind[];
  wariningTitle?: string;
  warningMessage?: string;
};
