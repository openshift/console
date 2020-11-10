import * as React from 'react';
import * as _ from 'lodash-es';
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from '@patternfly/react-core';
import { PficonDragdropIcon, MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export const KeyValueListEditor: React.FC<KeyValueListEditorProps> = ({ name, disableReorder = false }) => {
    const { control, register, getValues } = useFormContext();
    const { fields, append, remove, move } = useFieldArray<{ key: string, value: string }>({ control, name: name });

    const deleteIcon = (
        <>
            <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
            <span className="sr-only">Delete</span>
        </>
    );

    // 중복되는 key 유무에 대한 validation
    const validateKey = (keyValue) => {
        let count = 0;
        const itemArray = _.get(getValues(), name);
        for (let item of itemArray) {
            if (keyValue === item["key"] && ++count > 1) {
                return false;
            }
        }
        return true;
    }

    const validateValue = (valueValue) => {
        // value에 대한 validation은 아직 없음
        return true;
    }

    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        move(result.source.index, result.destination.index);
    }

    const renderList = () => {
        return (
            fields.map((item, index) => (
                <Draggable draggableId={item.id} index={index} key={item.id}>
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}>
                            <div
                                className={"col-xs-1 pairs-list__action " + (disableReorder ? 'hide' : '')}
                                {...provided.dragHandleProps}
                            ><PficonDragdropIcon /></div>
                            <div className="col-xs-5 pairs-list__name-field">
                                <input type="text" className="pf-c-form-control" ref={register({ validate: validateKey })} name={`${name}[${index}].key`} defaultValue={item.key} />
                            </div>
                            <div className="col-xs-5 pairs-list__value-field">
                                <input type="text" className="pf-c-form-control" ref={register({ validate: validateValue })} name={`${name}[${index}].value`} defaultValue={item.value} />
                            </div>
                            <Button
                                type="button"
                                data-test-id="pairs-list__delete-btn"
                                className='pairs-list__span-btns'
                                onClick={() => { remove(index); }}
                                variant="plain"
                            >
                                {deleteIcon}
                            </Button>
                        </div>
                    )}
                </Draggable>
            ))
        );
    }

    return (
        <div>
            <div className="row pairs-list__heading">
                {!disableReorder && <div className="col-xs-1 co-empty__header" />}
                <div className="col-xs-5 text-secondary text-uppercase">KEY</div>
                <div className="col-xs-5 text-secondary text-uppercase">VALUE</div>
                <div className="col-xs-1 co-empty__header" />
            </div>
            <div className="row">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="list">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                {renderList()}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                    <Button
                        className="pf-m-link--align-left"
                        data-test-id="pairs-list__add-btn"
                        onClick={() => { append({ key: "", value: "" }) }}
                        type="button"
                        variant="link"
                    >
                        <PlusCircleIcon
                            data-test-id="pairs-list__add-icon"
                            className="co-icon-space-r"
                        />
                        Add
                    </Button>
                </DragDropContext>
            </div>
        </div>
    );
}

type KeyValueListEditorProps = {
    name: string;
    disableReorder?: boolean;
}
