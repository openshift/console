import { OwnerReference } from '@console/internal/module/k8s';

export const compareOwnerReference = (
  obj: OwnerReference,
  otherObj: OwnerReference,
  compareModelOnly?: boolean,
) => {
  if (obj === otherObj) {
    return true;
  }
  if (!obj || !otherObj) {
    return false;
  }
  const isUIDEqual = obj.uid && otherObj.uid ? compareModelOnly || obj.uid === otherObj.uid : true;
  const isNameEqual = compareModelOnly || obj.name === otherObj.name;

  return (
    obj.apiVersion === otherObj.apiVersion &&
    obj.kind === otherObj.kind &&
    isNameEqual &&
    isUIDEqual
  );
};
