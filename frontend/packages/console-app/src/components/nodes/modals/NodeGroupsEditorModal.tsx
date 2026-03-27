import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertVariant,
  Bullseye,
  Button,
  ButtonVariant,
  Checkbox,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SimpleList,
  SimpleListItem,
  Spinner,
  TextInput,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import {
  getGroupVersionKindForModel,
  k8sPatchResource,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import { ResourceIcon } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import type { NodeKind } from '@console/internal/module/k8s';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import {
  getExistingGroups,
  getNodeGroupAnnotationFromGroups,
  getNodeGroups,
  GROUP_ANNOTATION,
  GROUP_SEPARATOR,
} from '../utils/NodeGroupUtils';

import './node-group-editor-modal.scss';

type GroupSelection = { groupName: string; selected: boolean };

const getGroupSelections = (node: NodeKind, nodes: NodeKind[]): GroupSelection[] => {
  const existingGroups = getExistingGroups(nodes);
  const selectedGroups = getNodeGroups(node);

  return existingGroups.map((groupName) => ({
    groupName,
    selected: selectedGroups.includes(groupName),
  }));
};

type NodeGroupsEditorModalProps = { node: NodeKind } & ModalComponentProps;

const NodeGroupsEditorModal: OverlayComponent<NodeGroupsEditorModalProps> = ({
  node,
  closeOverlay,
}) => {
  const { t } = useTranslation();
  const [groupSelections, setGroupSelections] = useState<GroupSelection[]>([]);
  const currentGroupSelections = useRef<GroupSelection[]>();
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [backgroundChange, setBackgroundChange] = useState<boolean>(false);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [retrievedNodes, nodesLoaded, nodesLoadError] = useK8sWatchResource<NodeKind[]>({
    groupVersionKind: {
      kind: 'Node',
      version: 'v1',
    },
    isList: true,
  });

  const nodes = useMemo(() => (retrievedNodes?.length ? retrievedNodes : [node]), [
    retrievedNodes,
    node,
  ]);

  useEffect(() => {
    if (!nodesLoaded || nodesLoadError) {
      return;
    }

    const updatedGroupSelections = getGroupSelections(node, nodes);

    if (!currentGroupSelections.current) {
      currentGroupSelections.current = [...updatedGroupSelections];
      setGroupSelections(updatedGroupSelections);
    } else if (!_.isEqual(updatedGroupSelections, currentGroupSelections.current)) {
      setBackgroundChange(true);
    }
  }, [node, nodes, nodesLoaded, nodesLoadError]);

  const handleGroupSelect = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    const target = event.currentTarget;
    const { name } = target;
    setGroupSelections((prev) =>
      prev.map((groupSelection) =>
        groupSelection.groupName === name ? { groupName: name, selected: checked } : groupSelection,
      ),
    );
  };

  const addNewGroup = () => {
    const groupNames = newGroupName.split(GROUP_SEPARATOR);
    if (groupNames.length) {
      setGroupSelections((prev) => {
        const newGroupSelections = groupNames.reduce<GroupSelection[]>(
          (acc, groupName) => {
            const normalizedName = groupName.trim();
            if (normalizedName && !acc.find((group) => group.groupName === normalizedName)) {
              acc.push({ groupName: normalizedName, selected: true });
            }
            return acc;
          },
          [...prev],
        );
        return newGroupSelections.sort((a, b) => a.groupName.localeCompare(b.groupName));
      });

      setNewGroupName('');
    }
  };

  const handleNameKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addNewGroup();
    }
  };

  const handleNameChange = (_ev: React.FormEvent<HTMLInputElement>, value: string) => {
    setNewGroupName(value);
  };

  const onReload = (e): void => {
    e.preventDefault();

    const updatedGroupSelections = getGroupSelections(node, nodes);

    currentGroupSelections.current = [...updatedGroupSelections];
    setGroupSelections(updatedGroupSelections);
    setBackgroundChange(false);
  };

  const onSubmit = (e): void => {
    e.preventDefault();
    setInProgress(true);
    setErrorMessage('');

    const groups = groupSelections
      .filter((groupSelection) => groupSelection.selected)
      .map((groupSelection) => groupSelection.groupName);

    const updatedAnnotations = {
      ...(node.metadata.annotations || {}),
      [GROUP_ANNOTATION]: getNodeGroupAnnotationFromGroups(groups),
    };

    const data = [
      {
        op: !node.metadata.annotations ? 'add' : 'replace',
        path: '/metadata/annotations',
        value: updatedAnnotations,
      },
    ];
    k8sPatchResource({ model: NodeModel, resource: node, data })
      .then(() => {
        setInProgress(false);
        closeOverlay();
      })
      .catch((err) => {
        setInProgress(false);
        setErrorMessage(err instanceof Error ? err.message : String(err));
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
        ) : (
          <Form>
            <FormGroup
              fieldId="groups"
              label={
                <>
                  <span className="pf-v6-u-mr-xs">{t('console-app~Groups for')}</span>
                  <ResourceIcon groupVersionKind={getGroupVersionKindForModel(NodeModel)} />
                  <span className="pf-v6-u-ml-xs">{node?.metadata?.name}</span>
                </>
              }
            >
              <div className="co-node-group-editor-modal__groups-list">
                {!groupSelections.length ? (
                  <Content component={ContentVariants.small} className="pf-v6-u-m-md">
                    {t('console-app~To get started, add a group')}
                  </Content>
                ) : (
                  // Use the length as a key to force a reset on change
                  <SimpleList key={groupSelections.length}>
                    {groupSelections.map((groupSelection) => (
                      <SimpleListItem isActive={false} key={groupSelection.groupName}>
                        <Checkbox
                          id={groupSelection.groupName}
                          isChecked={groupSelection.selected}
                          name={groupSelection.groupName}
                          onChange={handleGroupSelect}
                          label={groupSelection.groupName}
                        />
                      </SimpleListItem>
                    ))}
                  </SimpleList>
                )}
              </div>
            </FormGroup>
            <FormGroup fieldId="new-group" label={t('console-app~Add new group')}>
              <Flex spaceItems={{ default: 'spaceItemsSm' }} flexWrap={{ default: 'nowrap' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <TextInput
                    placeholder={t('console-app~Enter a group name')}
                    aria-label={t('console-app~Enter a group name')}
                    value={newGroupName}
                    onChange={handleNameChange}
                    onKeyDown={handleNameKeyDown}
                  />
                </FlexItem>
                <FlexItem>
                  <Button
                    variant={ButtonVariant.link}
                    onClick={() => addNewGroup()}
                    isDisabled={
                      !newGroupName.trim() ||
                      !!groupSelections.find((group) => group.groupName === newGroupName.trim())
                    }
                  >
                    {t('console-app~Add')}
                  </Button>
                </FlexItem>
              </Flex>
              <HelperText component="ul" className="pf-v6-u-mt-xs">
                <HelperTextItem component="li">
                  {t('console-app~Separate multiple group names with commas.')}
                </HelperTextItem>
              </HelperText>
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
            {t('console-app~Click Reload to see the changes.')}
          </Alert>
        )}
        {errorMessage && (
          <Alert
            isInline
            className="pf-v6-u-mt-md"
            variant={AlertVariant.danger}
            title={t('console-app~Error occurred')}
          >
            {errorMessage}
          </Alert>
        )}
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

export default NodeGroupsEditorModal;
