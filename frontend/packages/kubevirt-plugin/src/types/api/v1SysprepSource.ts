import { V1LocalObjectReference } from './V1LocalObjectReference';

/**
 * Represents a Sysprep volume source.
 * @export
 * @interface V1SysprepSource
 */
export interface V1SysprepSource {
  /**
   * ConfigMap references a ConfigMap that contains Sysprep answer file named autounattend.xml that should be attached as disk of CDROM type..
   */
  configMap?: V1LocalObjectReference;
  /**
   * Secret references a k8s Secret that contains Sysprep answer file named autounattend.xml that should be attached as disk of CDROM type.
   */
  secret?: V1LocalObjectReference;
}
