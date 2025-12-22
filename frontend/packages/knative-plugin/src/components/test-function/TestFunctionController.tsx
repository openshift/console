import type { FC } from 'react';
import { useCallback } from 'react';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ModalComponentProps, ModalWrapper } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
import { ServiceModel } from '../../models';
import { ServiceKind } from '../../types';
import TestFunction from './TestFunction';

type ControllerProps = {
  loaded?: boolean;
  obj: ServiceKind;
};

const Controller: FC<ControllerProps> = (props) => {
  const { loaded, obj } = props;
  return loaded ? <TestFunction {...props} service={obj} /> : null;
};

type TestFunctionControllerProps = {
  obj: ServiceKind;
};

const TestFunctionController: FC<TestFunctionControllerProps> = (props) => {
  const { obj } = props;

  const serverlessResources = [
    {
      kind: ServiceModel.kind,
      isList: false,
      prop: `obj`,
      namespace: obj.metadata.namespace,
      name: obj.metadata.name,
    },
  ];

  return (
    <Firehose resources={serverlessResources}>
      <Controller {...props} />
    </Firehose>
  );
};

type Props = TestFunctionControllerProps & ModalComponentProps;

const TestFunctionModalProvider: OverlayComponent<Props> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <TestFunctionController cancel={props.closeOverlay} close={props.closeOverlay} {...props} />
    </ModalWrapper>
  );
};

export const useTestFunctionModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<Props>(TestFunctionModalProvider, props), [launcher, props]);
};
