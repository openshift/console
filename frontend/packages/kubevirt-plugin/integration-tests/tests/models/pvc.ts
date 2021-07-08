/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { PVC_STATUS } from '@console/ceph-storage-plugin/integration-tests/utils/consts';
import {
  namespaceDropdown,
  pvcStatus,
  selectItemFromDropdown,
} from '@console/ceph-storage-plugin/integration-tests/views/pvc.view';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { click } from '@console/shared/src/test-utils/utils';
import { listViewAction } from '../../views/actions.view';
import * as pvcView from '../../views/pvc.view';
import { getTestDataVolume } from '../mocks/mocks';
import { PVCData } from '../types/pvc';
import { PVC_ACTION } from '../utils/constants/pvc';
import { UploadForm } from './pvcUploadForm';
import { UIResource } from './uiResource';

export class PVC<T extends PVCData> extends UIResource {
  protected data: T;

  readonly os: string;

  readonly image: string;

  constructor(data: T) {
    super({ name: data.pvcName, namespace: data.namespace, PersistentVolumeClaimModel });
    this.data = data;
    this.os = data.os;
    this.image = data.image;
  }

  async create() {
    const uploadForm = new UploadForm();
    await uploadForm.upload(this.data);
    await browser.wait(until.textToBePresentInElement(pvcView.uploadProgress, '100%'));
    await click(pvcView.viewStatusID);
    await browser.wait(until.textToBePresentInElement(pvcStatus, PVC_STATUS.BOUND));
  }

  async delete() {
    await clickNavLink(['Storage', 'PersistentVolumeClaims']);
    await crudView.isLoaded();
    await selectItemFromDropdown(this.namespace, namespaceDropdown);
    await crudView.resourceRowsPresent();
    await crudView.filterForName(this.name);
    await crudView.isLoaded();
    await listViewAction(this.name)(PVC_ACTION.Delete, true);
    await crudView.isLoaded();
    await browser.wait(until.stalenessOf(pvcView.pvcName(this.name)));
  }

  getDVResource() {
    return {
      kind: getTestDataVolume().kind,
      apiVersion: getTestDataVolume().apiVersion,
      metadata: {
        namespace: this.namespace,
        name: this.name,
      },
    };
  }
}
