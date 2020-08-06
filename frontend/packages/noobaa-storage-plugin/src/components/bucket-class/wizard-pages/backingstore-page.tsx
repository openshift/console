import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  Button,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  TextInput,
  Title,
} from '@patternfly/react-core';
import {
  IRowData,
  Table,
  TableBody,
  TableGridBreakpoint,
  TableHeader,
  TableVariant,
} from '@patternfly/react-table';
import {
  Firehose,
  FirehoseResult,
  ResourceLink,
  ExternalLink,
} from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { NooBaaBackingStoreModel } from '@console/noobaa-storage-plugin/src/models';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Action, BackingStoreStateType, State } from '../state';
import CreateBackingStoreFormModal from '../../create-backingstore-page/create-bs-modal';

const tableColumnClasses = [
  classNames('col-md-4', 'col-sm-4', 'col-xs-6', 'nb-bc-bs-table__data'),
  classNames('col-md-3', 'col-sm-4', 'col-xs-5', 'nb-bc-bs-table__data'),
  classNames('col-md-2', 'col-sm-3', 'hidden-xs'),
  classNames('col-md-2', 'hidden-sm', 'hidden-xs'),
];

const nameMap = {
  'aws-s3': 'awsS3',
  'azure-blob': 'azureBlob',
  'google-cloud-storage': 'googleCloudStorage',
  's3-compatible': 's3Compatible',
};

const columns = [
  {
    title: 'Name',
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'BucketName',
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Type',
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'Region',
    props: { className: tableColumnClasses[3] },
  },
];

const filterSelected = (list: BackingStoreStateType[], tableId: number) => {
  const sort = (x, y) => x.id.localeCompare(y.id);
  return list.filter((e) => e.selectedBy === tableId || e.selectedBy === '').sort(sort);
};

const getTableRows = (list: K8sResourceKind[], selectedItems: BackingStoreStateType[]) => {
  return list.reduce((acc, bs) => {
    const type: string = nameMap[_.get(bs, 'spec.type')];
    const currentItem = _.find(selectedItems, (item) => item.id === bs.metadata.name);
    const selected = currentItem ? currentItem.selected : false;
    const selectedBy = currentItem ? currentItem.selectedBy : '';
    const obj = {
      selected,
      id: bs.metadata.name,
      selectedBy,
      cells: [
        {
          title: (
            <ResourceLink
              kind={referenceForModel(NooBaaBackingStoreModel)}
              namespace={bs.metadata.namespace}
              name={bs.metadata.name}
              title={bs.metadata.uid}
            />
          ),
        },
        {
          title: _.get(bs, ['spec', type, 'targetBucket'], '-'),
        },
        {
          title: type,
        },
        {
          title: _.get(bs, ['spec', type, 'region'], '-'),
        },
      ],
    };
    return [...acc, obj];
  }, []);
};

const filterSelectedItems = (items: BackingStoreStateType[], tableId: number): string[] =>
  items.filter((e) => e.selectedBy === tableId).map((e) => e.id);

const getBsLabel = (policy: string) =>
  policy === 'Mirror'
    ? 'Select at least 2 Backing Store resources'
    : 'Select at least 1 Backing Store resource';

const BackingStorePage: React.FC<BackingStorePageProps> = React.memo(
  ({ backingStores, dispatcher, state }) => {
    // CR data
    const { data: backingStoreData } = backingStores;
    // CR data clones to maintain order and selection state for table rows
    const { backingStores: storeMain, namespace } = state;
    const { tier2Policy } = state;
    const showTier2Table = !!tier2Policy;
    const [searchInput, setSearchInput] = React.useState('');
    const [searchInput2, setSearchInput2] = React.useState('');
    const [showHelp, setShowHelp] = React.useState(true);

    const openModal = () => {
      CreateBackingStoreFormModal({ namespace });
    };

    const filterSearch = (search: string, list: BackingStoreStateType[]) => {
      if (!search) return list;
      return list.filter((elem) => fuzzy(search, elem.id));
    };

    React.useEffect(() => {
      const stores = getTableRows(backingStoreData, storeMain);
      dispatcher({ type: 'setBackingStores', value: stores });
      // eslint-disable-next-line
    }, [JSON.stringify(backingStoreData), dispatcher]);

    const onSelect = (isSelected: boolean, tableId: number, rowData: IRowData) => {
      const selectedItem = storeMain.find((elem) => elem.id === rowData.id);
      const store = new Set(storeMain);
      store.delete(selectedItem);
      selectedItem.selected = !selectedItem.selected;
      isSelected ? (selectedItem.selectedBy = tableId) : (selectedItem.selectedBy = '');
      store.add(selectedItem);
      dispatcher({ type: 'setBackingStores', value: [...store] });
      // 0 tier-1 table, 1 tier-2 table
      const itemsTable1 = filterSelectedItems(storeMain, 0);
      dispatcher({ type: 'setBackingStoreTier1', value: itemsTable1 });
      const itemsTable2 = filterSelectedItems(storeMain, 1);
      dispatcher({ type: 'setBackingStoreTier2', value: itemsTable2 });
    };

    return (
      <div className="nb-create-bc-step-page">
        {showHelp && (
          <Alert
            className="nb-create-bc-step-page__info"
            isInline
            variant="info"
            title="What is a Backing Store?"
            actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
          >
            <p>
              Backing Store represents a storage target to be used as the underlying storage for the
              data in MCG buckets.
            </p>
            <p>
              Multiple types of backing-stores are supported: asws-s3, s3-compatible,
              google-cloud-storage, azure-blob, obc, PVC.
            </p>
            <ExternalLink
              href="https://github.com/noobaa/noobaa-operator/blob/master/doc/backing-store-crd.md"
              text="Learn More"
            />
          </Alert>
        )}
        <Form className="nb-bc-step-page-form">
          <Title headingLevel="h3" size="xl" className="nb-bc-step-page-form__title">
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>Tier 1 - Backing Store ({state.tier1Policy})</FlexItem>
              <FlexItem>
                <Button
                  variant="link"
                  onClick={openModal}
                  className="nb-bc-step-page-form__modal-launcher"
                >
                  <PlusCircleIcon /> Create Backing Store
                </Button>
              </FlexItem>
            </Flex>
          </Title>

          <FormGroup
            className="nb-bc-step-page-form__element"
            fieldId="bs-1"
            label={getBsLabel(state.tier1Policy)}
            isRequired
          >
            <TextInput
              className="nb-bc-step-page-form__element--short"
              placeholder="Search Backing Store"
              onChange={setSearchInput}
              value={searchInput}
              type="text"
              aria-label="Search Backing Store"
            />
          </FormGroup>
          <Table
            onSelect={(event, isSelected, index, rowData) => onSelect(isSelected, 0, rowData)}
            cells={columns}
            rows={filterSearch(searchInput, filterSelected(storeMain, 0))}
            variant={TableVariant.compact}
            gridBreakPoint={TableGridBreakpoint.none}
            aria-label="Select Backing Store for Tier 1"
            className="nb-bc-bs-page__table--short"
            canSelectAll={false}
          >
            <TableHeader />
            <TableBody />
          </Table>
          <p className="nb-create-bc-step-page-form__element--light-text">
            {state.tier1BackingStore.length} resources selected
          </p>
        </Form>
        {showTier2Table && (
          <Form className="nb-bc-step-page-form">
            <Title headingLevel="h3" size="xl">
              Tier 2 - Backing Store ({state.tier2Policy}){' '}
            </Title>
            <FormGroup
              className="nb-bc-step-page-form__element"
              fieldId="bs-1"
              label={getBsLabel(state.tier2Policy)}
              isRequired
            >
              <TextInput
                className="nb-bc-step-page-form__element--short"
                placeholder="Search Backing Store"
                onChange={(v) => setSearchInput2(v)}
                value={searchInput2}
                type="text"
                aria-label="Search Backing Store"
              />
            </FormGroup>
            <Table
              aria-label="Select Backing Store for Tier 2"
              onSelect={(event, isSelected, index, rowData) => onSelect(isSelected, 1, rowData)}
              cells={columns}
              rows={filterSearch(searchInput2, filterSelected(storeMain, 1))}
              variant={TableVariant.compact}
              gridBreakPoint={TableGridBreakpoint.none}
              className="nb-bc-bs-page__table--short"
              canSelectAll={false}
            >
              <TableHeader />
              <TableBody />
            </Table>
            <p className="nb-create-bc-step-page-form__element--light-text">
              {state.tier2BackingStore.length} resources selected
            </p>
          </Form>
        )}
      </div>
    );
  },
);
const BackingStorePageWithFirehose: React.FC<BackingStorePageWithFirehoseProps> = (props) => {
  const resource = [
    {
      kind: referenceForModel(NooBaaBackingStoreModel),
      namespace: props.state.namespace,
      prop: 'backingStores',
      isList: true,
    },
  ];
  return (
    <Firehose resources={resource}>
      <BackingStorePage {...props} />
    </Firehose>
  );
};

export default BackingStorePageWithFirehose;

type BackingStorePageProps = {
  backingStores?: FirehoseResult<K8sResourceKind[]>;
  dispatcher: React.Dispatch<Action>;
  state: State;
};

type BackingStorePageWithFirehoseProps = {
  dispatcher: React.Dispatch<Action>;
  state: State;
};
