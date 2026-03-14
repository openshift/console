import { Fragment, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertVariant,
  Bullseye,
  Button,
  ButtonVariant,
  Checkbox,
  Content,
  ContentVariants,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  ExpandableSection,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SimpleList,
  SimpleListItem,
  Spinner,
  TextInput,
} from '@patternfly/react-core';
import { OutlinedTrashAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import type { ModalComponentProps } from '@console/internal/components/factory';
import { ExpandableAlert } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { useDeepCompareMemoize } from '@console/shared/src';
import type { GroupNameMap } from '../NodeGroupUtils';
import {
  getGroupsByNameFromNodes,
  getGroupsFromGroupLabel,
  getNodeGroupLabelFromGroupNameMap,
  getNodeGroupLabelFromGroups,
  getNodeGroups,
  GROUP_ANNOTATION,
} from '../NodeGroupUtils';

import './node-group-editor-modal.scss';

type PatchError = {
  title: string;
  message: string;
};

const GroupsEditorModal: OverlayComponent<ModalComponentProps> = ({ closeOverlay }) => {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>();
  const [groupsByName, setGroupsByName] = useState<GroupNameMap>({});
  const [nodeSelections, setNodeSelections] = useState<{ nodeName: string; selected: boolean }[]>(
    [],
  );
  const currentGroupsByName = useRef<GroupNameMap>();
  const [isAddExpanded, setIsAddExpanded] = useState<boolean>(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [backgroundChange, setBackgroundChange] = useState<boolean>(false);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [errors, setErrors] = useState<PatchError[]>([]);

  const [nodes, nodesLoaded, nodesLoadError] = useK8sWatchResource<NodeKind[]>({
    groupVersionKind: {
      kind: 'Node',
      version: 'v1',
    },
    isList: true,
  });

  const nodeNames = useDeepCompareMemoize(
    nodes.map((n) => n.metadata.name).sort((a, b) => a.localeCompare(b)),
  );

  useEffect(() => {
    if (!nodesLoaded || nodesLoadError) {
      return;
    }

    const updatedGroupsByName = getGroupsByNameFromNodes(nodes);

    if (!currentGroupsByName.current) {
      currentGroupsByName.current = updatedGroupsByName;
      setGroupsByName(updatedGroupsByName);
    } else if (!_.isEqual(updatedGroupsByName, currentGroupsByName.current)) {
      setBackgroundChange(true);
    }
  }, [nodes, nodesLoaded, nodesLoadError]);

  useEffect(() => {
    setNodeSelections(
      nodeNames.map((nodeName) => ({
        nodeName,
        selected: !!selectedGroup && groupsByName[selectedGroup]?.includes(nodeName),
      })),
    );
  }, [groupsByName, nodeNames, selectedGroup]);

  const handleNodeSelect = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    const target = event.currentTarget;
    const { name } = target;
    const updatedNodes = checked
      ? [...groupsByName[selectedGroup], name]
      : groupsByName[selectedGroup].filter((node) => node !== name);

    setGroupsByName((prev) => {
      const updatedGroupsByName = { ...prev };
      updatedGroupsByName[selectedGroup] = updatedNodes;
      return updatedGroupsByName;
    });
  };

  const removeGroup = (groupName: string) => {
    setGroupsByName((prev) => {
      const update = { ...prev };
      delete update[groupName];
      return update;
    });
    if (selectedGroup === groupName) {
      setSelectedGroup(undefined);
    }
  };

  const addNewGroup = () => {
    const normalizedName = newGroupName.trim();
    if (!normalizedName || normalizedName.includes(',')) {
      return;
    }
    if (groupsByName[normalizedName] === undefined) {
      setGroupsByName((prev) => ({ ...prev, [normalizedName]: [] }));
      setSelectedGroup(normalizedName);
      setNewGroupName('');
    }
  };

  const handleNameKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      event.preventDefault();
      addNewGroup();
    }
  };

  const handleNameChange = (event: React.FormEvent<HTMLInputElement>, value: string) => {
    setNewGroupName(value);
  };

  const onReload = (e): void => {
    e.preventDefault();
    const updateGroupsByName = getGroupsByNameFromNodes(nodes);

    currentGroupsByName.current = updateGroupsByName;
    setGroupsByName(updateGroupsByName);
    setSelectedGroup(undefined);
    setBackgroundChange(false);
    setErrors([]);
  };

  const onSubmit = (e): void => {
    e.preventDefault();
    setInProgress(true);
    setErrors([]);
    const patchErrors = [];

    const patchNode = async (
      node: NodeKind,
      updatedGroups: string[],
    ): Promise<PatchError | undefined> => {
      const updatedAnnotations = {
        ...(node.metadata.annotations || {}),
        [GROUP_ANNOTATION]: getNodeGroupLabelFromGroups(updatedGroups),
      };

      const data = [
        {
          op: !node.metadata.annotations ? 'add' : 'replace',
          path: '/metadata/annotations',
          value: updatedAnnotations,
        },
      ];

      return k8sPatchResource({
        model: NodeModel,
        resource: node,
        data,
      })
        .then(() => {
          return undefined;
        })
        .catch((error) => {
          patchErrors.push({
            title: t('console-app~Error updating {{nodeName}}', {
              nodeName: node.metadata.name,
            }),
            message: error instanceof Error ? error.message : String(error),
          });
        });
    };

    const updates = nodes.reduce<Promise<PatchError | undefined>[]>((acc, nextNode) => {
      const nodeGroups = getNodeGroups(nextNode);
      const updatedLabel = getNodeGroupLabelFromGroupNameMap(nextNode.metadata.name, groupsByName);
      const updatedGroups = getGroupsFromGroupLabel(updatedLabel);

      if (
        nodeGroups.length !== updatedGroups.length ||
        nodeGroups.find((group) => !updatedGroups.includes(group))
      ) {
        acc.push(patchNode(nextNode, updatedGroups));
      }
      return acc;
    }, []);

    if (!updates.length) {
      setInProgress(false);
      closeOverlay();
      return;
    }

    Promise.allSettled(updates)
      .then((results) => {
        setInProgress(false);

        const failures = results.filter((result) => result.status === 'rejected');
        failures.forEach((f) =>
          patchErrors.push({
            title: t('Failure updating a node:'),
            message: f.reason instanceof Error ? f.reason.message : String(f.reason),
          }),
        );

        setErrors(patchErrors);

        if (!patchErrors.length) {
          closeOverlay();
        }
      })
      .catch((error) => {
        setErrors([
          {
            title: t('console-app~Unable to update nodes'),
            message: error.toString(),
          },
        ]);
        setInProgress(false);
      });
  };

  return (
    <Modal isOpen onClose={closeOverlay} variant="small" className="co-node-group-editor-modal">
      <ModalHeader
        title={t('console-app~Edit groups')}
        description={t('console-app~Groups help you organize and select resources.')}
      />
      <ModalBody>
        {!nodesLoaded ? (
          <Bullseye className="co-node-group-editor-modal__loading-box">
            <Spinner />
          </Bullseye>
        ) : !nodes.length ? (
          <EmptyState
            headingLevel="h5"
            titleText={<>{t('console-app~No existing nodes')}</>}
            variant={EmptyStateVariant.full}
          >
            <EmptyStateBody>
              {t('console-app~Groups can only be created when there are existing nodes')}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <Form>
            <FormGroup label={t('console-app~Groups')} fieldId="groups">
              <div className="co-node-group-editor-modal__groups-list">
                {!Object.keys(groupsByName).length ? (
                  <Content component={ContentVariants.small} className="pf-v6-u-m-md">
                    {t('console-app~To get started, add a group')}
                  </Content>
                ) : (
                  <SimpleList key={selectedGroup}>
                    {Object.keys(groupsByName)
                      .sort((a, b) => a.localeCompare(b))
                      .map((groupName) => (
                        <SimpleListItem
                          key={groupName}
                          isActive={groupName === selectedGroup}
                          onClick={() => setSelectedGroup(groupName)}
                        >
                          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                            <FlexItem>{groupName}</FlexItem>
                            <FlexItem>
                              <Button
                                variant={ButtonVariant.plain}
                                aria-label={t('console-app~Delete group {{groupName}}', {
                                  groupName,
                                })}
                                hasNoPadding
                                icon={<OutlinedTrashAltIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeGroup(groupName);
                                }}
                              />
                            </FlexItem>
                          </Flex>
                        </SimpleListItem>
                      ))}
                  </SimpleList>
                )}
              </div>
            </FormGroup>
            <ExpandableSection
              toggleText={t('console-app~Add new group')}
              onToggle={() => {
                if (isAddExpanded) {
                  setNewGroupName('');
                }
                setIsAddExpanded((prev) => !prev);
                requestAnimationFrame(() => addInputRef.current?.focus());
              }}
              isExpanded={isAddExpanded}
            >
              <Flex
                className="pf-v6-u-ml-lg"
                spaceItems={{ default: 'spaceItemsSm' }}
                flexWrap={{ default: 'nowrap' }}
              >
                <FlexItem flex={{ default: 'flex_1' }}>
                  <TextInput
                    ref={addInputRef}
                    placeholder={t(
                      'console-app~Enter a group name, then press return, space, or comma',
                    )}
                    aria-label={t(
                      'console-app~Enter a group name, then press return, space, or comma',
                    )}
                    value={newGroupName}
                    onChange={handleNameChange}
                    onKeyDown={handleNameKeyDown}
                  />
                </FlexItem>
                <FlexItem>
                  <Button
                    variant={ButtonVariant.link}
                    onClick={() => addNewGroup()}
                    isDisabled={!newGroupName || groupsByName[newGroupName] !== undefined}
                  >
                    {t('console-app~Add')}
                  </Button>
                </FlexItem>
              </Flex>
            </ExpandableSection>
            <FormGroup fieldId="nodes">
              <label>
                {selectedGroup
                  ? `${t('console-app~Nodes for group')} ${selectedGroup}`
                  : t('console-app~Select a group above')}
              </label>

              <div className="co-node-group-editor-modal__groups-list">
                {nodeSelections.length ? (
                  <SimpleList key={selectedGroup}>
                    {nodeSelections.map((nodeSelection) => (
                      <SimpleListItem isActive={false} key={nodeSelection.nodeName}>
                        <Checkbox
                          id={nodeSelection.nodeName}
                          isDisabled={!selectedGroup}
                          isChecked={nodeSelection.selected}
                          name={nodeSelection.nodeName}
                          onChange={handleNodeSelect}
                          label={nodeSelection.nodeName}
                        />
                      </SimpleListItem>
                    ))}
                  </SimpleList>
                ) : null}
              </div>
            </FormGroup>
          </Form>
        )}
        {backgroundChange && (
          <Alert
            isInline
            className="pf-v6-u-mt-md"
            variant="info"
            title={t('console-app~Groups have been updated.')}
          >
            {t('console-app~Click reload to see the changes.')}
          </Alert>
        )}
        {!inProgress && errors.length > 0 && (
          <div className="pf-v6-u-mt-md">
            <ExpandableAlert
              variant={AlertVariant.danger}
              alerts={_.map(errors, (error, index) => (
                <Fragment key={index}>
                  <strong>{error.title}</strong>
                  <br />
                  {error.message}
                </Fragment>
              ))}
            />
          </div>
        )}{' '}
      </ModalBody>
      <ModalFooter>
        <Button
          type="submit"
          variant="primary"
          onClick={onSubmit}
          isDisabled={backgroundChange || inProgress}
        >
          {t('console-app~Save')}
        </Button>
        <Button variant="secondary" onClick={onReload} type="button">
          {t('console-app~Reload')}
        </Button>
        <Button variant="secondary" onClick={closeOverlay} type="button">
          {t('console-app~Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default GroupsEditorModal;
