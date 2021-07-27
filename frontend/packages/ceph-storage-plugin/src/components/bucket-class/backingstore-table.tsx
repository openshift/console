import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { compose } from 'redux';
import { Title, Flex, FlexItem, Button, FormGroup, Form, Alert } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { IRow, sortable } from '@patternfly/react-table';
import {
  getNamespace,
  getName,
  useSelectList,
  getUID,
  useDeepCompareMemoize,
} from '@console/shared';
import { Table, ListPage } from '@console/internal/components/factory';
import { getFilteredRows } from '@console/internal/components/factory/table-data-hook';
import { Filter } from '@console/internal/components/factory/table';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  getBucketName,
  getRegion,
  getBackingStoreType,
  getBSLabel,
} from '../../utils/noobaa-utils';
import CreateBackingStoreFormModal from '../create-backingstore-page/create-bs-modal';
import { NooBaaBackingStoreModel } from '../../models';
import { BackingStoreKind, PlacementPolicy } from '../../types';
import './_backingstore-table.scss';

const tableColumnClasses = [
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
];

const getRows: GetRows = (rowProps, selectedItems) => {
  const {
    componentProps: { data },
  } = rowProps;

  const rows = data.map((bs) => {
    const cells: IRow['cells'] = [
      {
        title: (
          <ResourceLink
            linkTo={false}
            kind={referenceForModel(NooBaaBackingStoreModel)}
            name={getName(bs)}
            namespace={getNamespace(bs)}
          />
        ),
      },
      {
        title: getBucketName(bs) || '-',
      },
      {
        title: getBackingStoreType(bs) || '-',
      },
      {
        title: getRegion(bs) || '-',
      },
    ];
    return {
      cells,
      selected: selectedItems?.has(bs.metadata.uid),
      props: {
        id: getUID(bs),
      },
    };
  });
  return rows;
};

const BackingStoreTable: React.FC<BackingStoreTableProps> = (props) => {
  const { t } = useTranslation();

  const {
    customData: { onRowsSelected, preSelected },
    data,
    filters,
  } = props;
  const visibleRows = getFilteredRows(filters, null, data);
  const visibleUIDs = React.useMemo(() => new Set<string>(visibleRows?.map(getUID)), [visibleRows]);
  const { onSelect, selectedRows, updateSelectedRows } = useSelectList<BackingStoreKind>(
    data,
    visibleUIDs,
    onRowsSelected,
  );
  const memoizedData = useDeepCompareMemoize(data, true);
  const memoizedPreSelected = useDeepCompareMemoize(preSelected, true);
  React.useEffect(() => {
    if (!_.isEmpty(memoizedPreSelected) && selectedRows.size === 0) {
      const preSelectedRows = memoizedData.filter((item) =>
        memoizedPreSelected.includes(getUID(item)),
      );
      updateSelectedRows(preSelectedRows);
    }
  }, [memoizedData, memoizedPreSelected, selectedRows.size, updateSelectedRows]);

  const getColumns = () => [
    {
      title: t('ceph-storage-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('ceph-storage-plugin~Bucket Name'),
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('ceph-storage-plugin~Type'),
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('ceph-storage-plugin~Region'),
      props: { className: tableColumnClasses[3] },
    },
  ];

  return (
    <Table
      {...props}
      onSelect={onSelect}
      virtualize={false}
      Header={getColumns}
      Rows={(rowProps) => getRows(rowProps, selectedRows)}
      aria-label={t('ceph-storage-plugin~BackingStore Table')}
    />
  );
};

const BackingStoreList: React.FC<BackingStoreListProps> = ({
  unselectableItems = [],
  onSelectBackingStore,
  preSelected = [],
  name,
}) => {
  const flatten = compose(
    (data: BackingStoreKind[]) =>
      _.filter(data, (item) => !unselectableItems.includes(item?.metadata?.uid)),
    (resources) => resources?.[referenceForModel(NooBaaBackingStoreModel)]?.data ?? {},
  );

  return (
    <div className="nb-bs-table">
      <ListPage
        kind={referenceForModel(NooBaaBackingStoreModel)}
        showTitle={false}
        flatten={flatten}
        ListComponent={BackingStoreTable}
        customData={{ onRowsSelected: onSelectBackingStore, preSelected }}
        name={name}
      />
    </div>
  );
};

const BackingStoreSelection: React.FC<BackingStoreSelectionProps> = (props) => {
  const {
    namespace,
    tier1Policy,
    tier2Policy,
    setSelectedTierA,
    setSelectedTierB,
    hideCreateBackingStore = false,
  } = props;

  const { t } = useTranslation();

  const openModal = () => CreateBackingStoreFormModal({ namespace });
  const selectedTierA = props.selectedTierA.map(getUID);
  const selectedTierB = props.selectedTierB.map(getUID);

  return (
    <>
      <Form
        className={classNames('nb-bc-step-page-form', {
          'nb-bc-step-page-form--margin': !!tier2Policy,
        })}
      >
        {!!tier2Policy && (
          <Alert
            className="co-alert"
            variant="info"
            title={t(
              'ceph-storage-plugin~Each BackingStore can be used for one tier at a time. Selecting a BackingStore in one tier will remove the resource from the second tier option and vice versa.',
            )}
            aria-label={t(
              "ceph-storage-plugin~Bucket created for OpenShift Data Foundation's Service",
            )}
            isInline
          />
        )}
        <Title headingLevel="h3" size="xl" className="nb-bc-step-page-form__title">
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
            <Title headingLevel="h3" size="xl">
              {t('ceph-storage-plugin~Tier 1 - BackingStores')}{' '}
              {tier1Policy ? `(${tier1Policy})` : ''}
            </Title>
            {!hideCreateBackingStore && (
              <FlexItem>
                <Button
                  variant="link"
                  onClick={openModal}
                  className="nb-bc-step-page-form__modal-launcher"
                >
                  <PlusCircleIcon /> {t('ceph-storage-plugin~Create BackingStore ')}
                </Button>
              </FlexItem>
            )}
          </Flex>
        </Title>

        <FormGroup
          className="nb-bc-step-page-form__element"
          fieldId="bs-1"
          label={getBSLabel(tier1Policy, t)}
          isRequired
        >
          <BackingStoreList
            unselectableItems={selectedTierB}
            onSelectBackingStore={setSelectedTierA}
            preSelected={selectedTierA}
            name={t('ceph-storage-plugin~Tier-1-Table')}
          />
        </FormGroup>
        <p className="nb-create-bc-step-page-form__element--light-text">
          {t('ceph-storage-plugin~{{bs, number}} BackingStore ', {
            bs: selectedTierA.length,
            count: selectedTierA.length,
          })}{' '}
          {t('ceph-storage-plugin~selected')}
        </p>
      </Form>
      {!!tier2Policy && (
        <Form className="nb-bc-step-page-form">
          <Title headingLevel="h3" size="xl">
            {t('ceph-storage-plugin~Tier 2 - BackingStores')}{' '}
            {tier2Policy ? `(${tier2Policy})` : ''}
          </Title>
          <FormGroup
            className="nb-bc-step-page-form__element"
            fieldId="bs-2"
            label={getBSLabel(tier2Policy, t)}
            isRequired
          >
            <BackingStoreList
              unselectableItems={selectedTierA}
              onSelectBackingStore={setSelectedTierB}
              preSelected={selectedTierB}
              name={t('ceph-storage-plugin~Tier-2-Table')}
            />
          </FormGroup>
          <p className="nb-create-bc-step-page-form__element--light-text">
            {t('ceph-storage-plugin~{{bs, number}} BackingStore ', {
              bs: selectedTierB.length,
              count: selectedTierB.length,
            })}{' '}
            {t('ceph-storage-plugin~selected')}
          </p>
        </Form>
      )}
    </>
  );
};

export default BackingStoreSelection;

type BackingStoreTableProps = {
  data?: BackingStoreKind[];
  customData?: {
    onRowsSelected?: (arg: BackingStoreKind[]) => void;
    preSelected?: string[];
  };
  filters?: Filter[];
  preSelected?: string[];
};

type BackingStoreListProps = {
  unselectableItems?: string[];
  onSelectBackingStore?: (arg: BackingStoreKind[]) => void;
  preSelected?: string[];
  name?: string;
};

type BackingStoreSelectionProps = {
  namespace: string;
  selectedTierA: BackingStoreKind[];
  setSelectedTierA: (arg: BackingStoreKind[]) => void;
  selectedTierB: BackingStoreKind[];
  setSelectedTierB: (arg: BackingStoreKind[]) => void;
  tier1Policy: PlacementPolicy;
  tier2Policy: PlacementPolicy;
  hideCreateBackingStore?: boolean;
};

type GetRows = (
  rowProps: { componentProps: { data: BackingStoreKind[] } },
  selectedItems: Set<string>,
) => { cells: IRow['cells']; selected: boolean; props: { id: string } }[];
