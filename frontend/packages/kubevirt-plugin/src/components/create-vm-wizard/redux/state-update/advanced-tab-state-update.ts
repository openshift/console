import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
} from '../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { iGetIn } from '../../../../utils/immutable';
import { iGetCloudInitNoCloudStorage } from '../../selectors/immutable/storage';
import { getSSHTempKey } from '../../selectors/immutable/wizard-selectors';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType, UpdateOptions } from '../types';

const initialAdvancedTabUpdater = ({ id, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  const tempSSHKey = getSSHTempKey(state);
  const iCloudInitNoCloudStorage = iGetCloudInitNoCloudStorage(state, id);
  const data = new CloudInitDataHelper(
    iGetIn(iCloudInitNoCloudStorage, ['volume', 'cloudInitNoCloud'])?.toJS(),
  );

  if (
    !iCloudInitNoCloudStorage ||
    !data ||
    !tempSSHKey ||
    data.hasKey(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS)
  ) {
    return;
  }

  data.set(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS, tempSSHKey);

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateStorage](id, {
      id: iCloudInitNoCloudStorage?.get('id'),
      type: iCloudInitNoCloudStorage?.get('type'),
      disk: iCloudInitNoCloudStorage?.get('disk')?.toJS(),
      volume: new VolumeWrapper(iCloudInitNoCloudStorage?.get('volume')?.toJS())
        .setTypeData(data.asCloudInitNoCloudSource())
        .asResource(),
    }),
  );
};

export const updateAdvancedTabState = (options: UpdateOptions) =>
  [initialAdvancedTabUpdater].forEach((updater) => {
    updater && updater(options);
  });
