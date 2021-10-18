import { DeletePDBModalProps } from './DeletePDBModal';

export const deletePDBModal = (props: DeletePDBModalProps) =>
  import('./DeletePDBModal' /* webpackChunkName: "shared-modals" */).then((m) =>
    m.deletePDBModal(props),
  );
