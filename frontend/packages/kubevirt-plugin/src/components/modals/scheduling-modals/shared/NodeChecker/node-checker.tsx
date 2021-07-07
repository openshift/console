import * as React from 'react';
import {
  Alert,
  Button,
  Popover,
  PopoverPosition,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  ExternalLink,
  pluralize,
  ResourceLink,
  resourcePath,
} from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { getName } from '../../../../../selectors';
import {
  getSchedulingNodesMatchButtonLabel,
  getSchedulingNodesMatchMsg,
  getSchedulingWithPreferredNodesMatchMsg,
} from '../consts';

import './node-checker.scss';

export const NodeChecker: React.FC<NodeCheckerProps> = ({
  qualifiedNodes,
  qualifiedPreferredNodes,
  warningTitle,
  warningMessage,
}) => {
  const { t } = useTranslation();
  const qualifiedNodesSize = qualifiedNodes.length;
  const buttonText = pluralize(qualifiedNodesSize, 'Node');
  const preferredNodes = new Set(qualifiedPreferredNodes?.map((node) => getName(node)));

  return (
    <Alert
      className="kv-node-checker"
      variant={
        qualifiedNodesSize > 0 || qualifiedPreferredNodes?.length > 0 ? 'success' : 'warning'
      }
      isInline
      title={
        qualifiedNodesSize > 0
          ? qualifiedPreferredNodes?.length > 0
            ? getSchedulingWithPreferredNodesMatchMsg(
                qualifiedNodesSize,
                qualifiedNodesSize < qualifiedPreferredNodes.length
                  ? qualifiedNodesSize
                  : qualifiedPreferredNodes.length,
              )
            : getSchedulingNodesMatchMsg(qualifiedNodesSize)
          : qualifiedPreferredNodes?.length > 0
          ? getSchedulingNodesMatchMsg(qualifiedPreferredNodes?.length)
          : warningTitle || t('kubevirt-plugin~No matching nodes found for the labels')
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
                : qualifiedPreferredNodes?.map((node) => (
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
                (!qualifiedPreferredNodes || qualifiedPreferredNodes?.length === 0)
              }
              variant="link"
            >
              <Text component={TextVariants.h4}>
                {qualifiedNodesSize > 0
                  ? getSchedulingNodesMatchButtonLabel(qualifiedNodesSize)
                  : qualifiedPreferredNodes?.length > 0
                  ? getSchedulingNodesMatchMsg(qualifiedPreferredNodes?.length)
                  : warningMessage ||
                    t('kubevirt-plugin~Scheduling will not be possible at this state')}
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
  qualifiedPreferredNodes?: NodeKind[];
  warningTitle?: string;
  warningMessage?: string;
};
