import * as React from 'react';
import { useState, useEffect } from 'react';
import * as _ from 'lodash-es';
import { Table as PfTable, TableHeader as PfTableHeader, TableBody as PfTableBody, IRow, ICell } from '@patternfly/react-table';

export const SingleExpandableTable: React.FC<SingleExpandableTableProps> = ({ header, itemList, fetchInnerListData, matchField, matchInnerField, rowRenderer, innerRenderer, compoundParent }) => {
  const [tableRows, setTableRows] = useState<IRow[]>([]);

  useEffect(() => {
    const preData = [];
    fetchInnerListData().then(innerRes => {
      _.forEach(itemList, (item, index: number) => {
        const innerItemsData = [];
        _.forEach(innerRes, innerItem => {
          if (_.get(innerItem, matchInnerField) === _.get(item, matchField)) {
            innerItemsData.push(innerItem);
          }
        });

        if (innerItemsData.length > 0) {
          preData.push({
            isOpen: false,
            cells: rowRenderer(index, item, innerItemsData.length),
          });
          //TODO: parent 값으로 어떤걸 넣어줘야 되는지 파악하기
          let parentValue = 2 * index;
          preData.push({
            parent: parentValue,
            compoundParent: compoundParent,
            cells: [
              {
                title: innerRenderer(innerItemsData),
                props: { colSpan: header.length, className: 'pf-m-no-padding' },
              },
            ],
          });
        } else {
          preData.push({
            isOpen: false,
            cells: rowRenderer(index, item, 0),
          });
        }

        setTableRows(_.cloneDeep(preData));
      });
    });
  }, [itemList]);
  const onExpand = (event, rowIndex, colIndex, isOpen, rowData, extraData) => {
    let rows: IRow[] = _.cloneDeep(tableRows);
    if (!isOpen) {
      // set all other expanded cells false in this row if we are expanding
      rows[rowIndex].cells.forEach((cell: ICell) => {
        if (cell.props) cell.props.isOpen = false;
      });
      (rows[rowIndex].cells[colIndex] as ICell).props.isOpen = true;
      rows[rowIndex].isOpen = true;
    } else {
      (rows[rowIndex].cells[colIndex] as ICell).props.isOpen = false;
      rows[rowIndex].isOpen = rows[rowIndex].cells.some((cell: ICell) => cell.props && cell.props.isOpen);
    }
    setTableRows(rows);
  };

  return (
    <PfTable aria-label="Compound expandable table" onExpand={onExpand} rows={tableRows} cells={header}>
      <PfTableHeader />
      <PfTableBody />
    </PfTable>
  );
};

type SingleExpandableTableProps = {
  itemList: any[]; // outer table의 itemList
  fetchInnerListData: () => Promise<any>; // inner table의 전체 리소스 리스트를 불러오는 fetch 함수 (promise를 return하는 형태의 함수)
  rowRenderer: (index, obj, itemCount: number) => any[]; // outer table의 row 한줄에 들어갈 요소들을 배열 형태로 return하는 renderer 함수
  innerRenderer: (data) => string | React.ReactNode; // inner table을 render하는 함수
  matchField: string; // inner table에 보여줄 데이터 필터링에 쓸 outer data의 비교기준 field
  matchInnerField: string; // inner table에 보여줄 데이터 필터링에 쓸 inner data의 비교기준 field
  header: (ICell | string)[]; // header column들의 배열. 펼침 기능을 사용할 column object에는 cellTransforms: [compoundExpand] 속성 넣어줘야 함.
  compoundParent: number; // table 펼칠 수 있는 column의 index
};
