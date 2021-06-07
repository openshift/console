import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  Title,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { getName, getUID } from '@console/shared';
import { NamespaceStoreKind } from '../../../../types';
import { NamespaceStoreList } from '../../../namespace-store/namespace-store-table';
import { Action, State } from '../../state';
import NamespaceStoreModal from '../../../namespace-store/namespace-store-modal';
import { NamespaceStoreDropdown } from '../../../namespace-store/namespace-store-dropdown';

export const MultiNamespaceStorePage: React.FC<MultiNamespaceStoreProps> = React.memo(
  ({ state, dispatch, namespace, hideCreateNamespaceStore = false }) => {
    const { t } = useTranslation();
    const openModal = () => NamespaceStoreModal({ namespace });
    const [selectedCount, setSelectedCount] = React.useState(state.readNamespaceStore.length);
    const [enabledItems, setEnabledItems] = React.useState([]);
    const [selectedItem, setSelectedItem] = React.useState(
      getName(state.writeNamespaceStore[0]) ?? '',
    );

    React.useEffect(() => {
      const readItems = state.readNamespaceStore.map(getName);
      setEnabledItems(readItems);
    }, [state.readNamespaceStore]);

    const onSelectNamespaceStoreTable = (selectedNamespaceStore: NamespaceStoreKind[]) => {
      dispatch({ type: 'setReadNamespaceStore', value: selectedNamespaceStore });
      setSelectedCount(selectedNamespaceStore.length);
      if (!selectedNamespaceStore.map(getName).includes(getName(state.writeNamespaceStore[0]))) {
        dispatch({ type: 'setWriteNamespaceStore', value: [] });
        setSelectedItem('');
      }
    };

    const onSelectNamespaceStoreDropdown = (selectedNamespaceStore: NamespaceStoreKind) => {
      dispatch({ type: 'setWriteNamespaceStore', value: [selectedNamespaceStore] });
      setSelectedItem(getName(selectedNamespaceStore));
    };

    return (
      <div className="nb-create-bc-step-page">
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsCenter' }}
        >
          <FlexItem>
            <Title size="xl" headingLevel="h2">
              {t('ceph-storage-plugin~Read NamespaceStores')}
            </Title>
            <p className="nb-create-bc-step-page-form__element--light-text">
              {t(
                'ceph-storage-plugin~Select a list of NamespaceStores that defines the read targets of the namespace bucket.',
              )}
            </p>
          </FlexItem>
          {!hideCreateNamespaceStore && (
            <FlexItem>
              <Button
                variant={ButtonVariant.link}
                onClick={openModal}
                className="nb-bc-step-page-form__modal-launcher"
              >
                <PlusCircleIcon /> {t('ceph-storage-plugin~Create NamespaceStore')}
              </Button>
            </FlexItem>
          )}
        </Flex>
        <Form className="nb-create-bc-step-page-form">
          <FormGroup className="nb-create-bc-step-page-form" fieldId="namespacestoretable-input">
            <NamespaceStoreList
              preSelected={state.readNamespaceStore.map(getUID)}
              onSelectNamespaceStore={onSelectNamespaceStoreTable}
            />
          </FormGroup>
          <p className="nb-create-bc-step-page-form__element--light-text">
            {t('ceph-storage-plugin~{{nns, number}} namespace store ', {
              nns: selectedCount,
              count: selectedCount,
            })}
            {t('ceph-storage-plugin~ selected')}
          </p>
          <Title size="xl" headingLevel="h2">
            {t('ceph-storage-plugin~Write NamespaceStore')}
          </Title>
          <p className="nb-create-bc-step-page-form__element--light-text">
            {t(
              'ceph-storage-plugin~Select a single NamespaceStore that defines the write targets of the namespace bucket.',
            )}
          </p>
          <FormGroup className="nb-create-bc-step-page-form" fieldId="namespacestore-input">
            <NamespaceStoreDropdown
              id="namespacestore-input"
              selectedKey={selectedItem}
              className="nb-create-bc-step-page-form--dropdown"
              namespace={namespace}
              onChange={onSelectNamespaceStoreDropdown}
              enabledItems={enabledItems}
              namespacePolicy={state.namespacePolicyType}
              creatorDisabled
            />
          </FormGroup>
        </Form>
      </div>
    );
  },
);

type MultiNamespaceStoreProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  namespace?: string;
  hideCreateNamespaceStore?: boolean;
};
