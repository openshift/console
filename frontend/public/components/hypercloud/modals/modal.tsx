import * as React from 'react';
import * as _ from 'lodash-es';
import { ActionGroup, Button } from '@patternfly/react-core';
import { ModalFooter } from '../../factory';

export const CustomModalSubmitFooter: React.SFC<CustomModalSubmitFooterProps> = ({
  message,
  errorMessage,
  inProgress,
  leftBtnText,
  rightBtnText,
  onClickLeft,
  onClickRight
}) => {

  return (
    <ModalFooter inProgress={inProgress} errorMessage={errorMessage} message={message}>
      <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
          <Button type="submit" variant="primary" id="confirm-action" onClick={onClickLeft}>
            {leftBtnText}
          </Button>
          <Button type="submit" variant="secondary"  id="confirm-action"onClick={onClickRight}>
            {rightBtnText}
          </Button>
      </ActionGroup>
    </ModalFooter>
  );
};

export type CustomModalSubmitFooterProps = {
  message?: string;
  errorMessage?: string;
  inProgress: boolean;
  leftBtnText:string;
  rightBtnText:string;  
  onClickLeft: () => void;
  onClickRight: () => void;
};
