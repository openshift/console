import { $, browser, ExpectedConditions as until } from 'protractor';
import * as crudView from '../views/crud.view';

export const createNewClaim = $('[value=new]');
export const inputPVCName = $('#pvc-name');
export const inputPVCSize = $('[name=requestSizeValue]');
export const inputMountPath = $('#mount-path');

export const addNewStorageToWorkload = async function(
  pvcName: string,
  pvcSize: string,
  mountPath: string,
) {
  await crudView.clickDetailsPageAction('Add storage');
  await browser.wait(until.presenceOf(createNewClaim));
  await createNewClaim.click();
  await inputPVCName.sendKeys(pvcName);
  await inputPVCSize.sendKeys(pvcSize);
  await inputMountPath.sendKeys(mountPath);
  await crudView.saveChangesBtn.click();
};
