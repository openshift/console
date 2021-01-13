import { useFormContext, useFieldArray } from 'react-hook-form';
import * as React from 'react';
import * as _ from 'lodash-es';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
export const ListView: React.FC<ListViewProps> = ({ name, defaultItem = { key: '', value: '' }, itemRenderer, headerFragment, addButtonText }) => {
  const { control, register, getValues } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: name });

  const DefaultListHeaderFragment = (
    <div className="row pairs-list__heading">
      <div className="col-xs-4 text-secondary text-uppercase">KEY</div>
      <div className="col-xs-4 text-secondary text-uppercase">VALUE</div>
      <div className="col-xs-1 co-empty__header" />
    </div>
  );

  const DefaultListItemRenderer = (register, item, index, ListActions, ListDefaultIcons) => {
    return (
      <div className="row" key={item.id}>
        <div className="col-xs-4 pairs-list__name-field">
          <input ref={register()} className="pf-c-form-control" name={`${name}[${index}].key`} defaultValue={item.key}></input>
        </div>
        <div className="col-xs-4 pairs-list__value-field">
          <input ref={register()} className="pf-c-form-control" name={`${name}[${index}].value`} defaultValue={item.value}></input>
        </div>
        <div className="col-xs-1 pairs-list__action">
          <Button
            type="button"
            data-test-id="pairs-list__delete-btn"
            className="pairs-list__span-btns"
            onClick={() => {
              ListActions.remove(index);
            }}
            variant="plain"
          >
            {ListDefaultIcons.deleteIcon}
          </Button>
        </div>
      </div>
    );
  };

  const deleteIcon = (
    <>
      <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
      <span className="sr-only">Delete</span>
    </>
  );

  const ListActions = {
    append: append,
    remove: remove,
    getValues: getValues,
  };

  const ListDefaultIcons = {
    deleteIcon: deleteIcon,
  };

  const itemList = itemRenderer ? fields.map((item, index) => itemRenderer(register, item, index, ListActions, ListDefaultIcons)) : fields.map((item, index) => DefaultListItemRenderer(register, item, index, ListActions, ListDefaultIcons));

  return (
    <div>
      {headerFragment ? headerFragment : DefaultListHeaderFragment}
      {itemList}
      <div className="row col-xs-12">
        <Button
          className="pf-m-link--align-left"
          data-test-id="pairs-list__add-btn"
          onClick={() => {
            append(defaultItem);
          }}
          type="button"
          variant="link"
        >
          <PlusCircleIcon data-test-id="pairs-list__add-icon" className="co-icon-space-r" />
          {!!addButtonText ? addButtonText : 'Add'}
        </Button>
      </div>
    </div>
  );
};

type ListViewProps = {
  name: string;
  defaultItem?: object;
  itemRenderer?: Function;
  headerFragment?: JSX.Element;
  addButtonText?: string;
};
