import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import * as cx from 'classnames';
import { FocusTrap, Tooltip } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { useHover } from '@patternfly/react-topology';
import Popper from '@console/shared/src/components/popper/Popper';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  KebabItem,
  KebabOption,
  ResourceIcon,
  truncateMiddle,
} from '@console/internal/components/utils';
import { getResourceModelFromTaskKind } from '../../../utils/pipeline-augment';
import { TaskKind } from '../../../types';
import { NewTaskNodeCallback } from './types';

type KeyedKebabOption = KebabOption & { key: string };

const taskToOption = (task: TaskKind, callback: NewTaskNodeCallback): KeyedKebabOption => {
  const {
    kind,
    metadata: { name },
  } = task;

  return {
    key: `${name}-${kind}`,
    label: name,
    icon: <ResourceIcon kind={referenceForModel(getResourceModelFromTaskKind(kind))} />,
    callback: () => {
      callback(task);
    },
  };
};

const TaskList: React.FC<any> = ({
  width,
  height,
  listOptions,
  unselectedText,
  onRemoveTask,
  onNewTask,
}) => {
  const { t } = useTranslation();
  const triggerRef = React.useRef(null);
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const [hover, hoverRef] = useHover();

  const options = _.sortBy(
    listOptions.map((task) => taskToOption(task, onNewTask)),
    (o) => o.label,
  );
  const unselectedTaskText = unselectedText || t('pipelines-plugin~Select Task');

  const truncatedTaskText = React.useMemo(
    () =>
      truncateMiddle(unselectedTaskText, {
        length: 10,
        truncateEnd: true,
      }),
    [unselectedTaskText],
  );
  const renderText = (
    <text x={width / 2 - 10} y={height / 2 + 1}>
      {truncatedTaskText}
    </text>
  );

  return (
    <>
      <g
        data-test="task-list"
        ref={hoverRef}
        className="odc-task-list-node__trigger"
        onClick={() => setMenuOpen(!isMenuOpen)}
      >
        <rect
          ref={triggerRef}
          className={cx('odc-task-list-node__trigger-background', {
            'is-disabled': options.length === 0,
          })}
          width={width}
          height={height}
        />
        {options.length === 0 ? (
          <text className="odc-task-list-node__trigger-disabled" x={width / 2} y={height / 2 + 1}>
            {t('pipelines-plugin~No Tasks')}
          </text>
        ) : (
          <g>
            <rect
              className={
                hover
                  ? 'odc-task-list-node__trigger-underline--hover'
                  : 'odc-task-list-node__trigger-underline'
              }
              y={height}
              width={width}
              height={hover ? 2 : 1}
            />
            {unselectedTaskText !== truncatedTaskText ? (
              <Tooltip content={unselectedTaskText}>{renderText}</Tooltip>
            ) : (
              renderText
            )}
            <g transform={`translate(${width - 30}, ${height / 4})`}>
              <CaretDownIcon />
            </g>
          </g>
        )}
      </g>
      <Popper
        open={isMenuOpen}
        placement="bottom-start"
        closeOnEsc
        closeOnOutsideClick
        onRequestClose={(e) => {
          if (!e || !triggerRef?.current?.contains(e.target as Element)) {
            setMenuOpen(false);
          }
        }}
        reference={() => triggerRef.current}
      >
        <FocusTrap
          focusTrapOptions={{ clickOutsideDeactivates: true, returnFocusOnDeactivate: false }}
        >
          <div className="pf-c-dropdown pf-m-expanded odc-task-list-node__container">
            <ul className="pf-c-dropdown__menu pf-m-align-right oc-kebab__popper-items odc-task-list-node__list-items">
              {options.map((option) => (
                <li key={option.key}>
                  <KebabItem
                    option={option}
                    onClick={() => {
                      option.callback && option.callback();
                    }}
                  />
                </li>
              ))}
              {onRemoveTask && (
                <>
                  <li>
                    <hr className="odc-task-list-node__divider" />
                  </li>
                  <li>
                    <KebabItem
                      option={{ label: t('pipelines-plugin~Delete Task'), callback: onRemoveTask }}
                      onClick={onRemoveTask}
                    />
                  </li>
                </>
              )}
            </ul>
          </div>
        </FocusTrap>
      </Popper>
    </>
  );
};
export default TaskList;
