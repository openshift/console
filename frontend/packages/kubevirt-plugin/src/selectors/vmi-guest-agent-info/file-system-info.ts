import {
  V1VirtualMachineInstanceFileSystem,
  V1VirtualMachineInstanceFileSystemInfo,
  V1VirtualMachineInstanceFileSystemList,
} from '../../types/vmi-guest-data-info/vmi-guest-agent-info';

// Selectors for V1VirtualMachineInstanceFileSystem
export const getFileSystemDiskName = (fileSystem: V1VirtualMachineInstanceFileSystem): string =>
  fileSystem?.diskName;

export const getFileSystemType = (fileSystem: V1VirtualMachineInstanceFileSystem): string =>
  fileSystem?.fileSystemType;

export const getFileSystemMountPoint = (fileSystem: V1VirtualMachineInstanceFileSystem): string =>
  fileSystem?.mountPoint;

export const getFileSystemTotalBytes = (fileSystem: V1VirtualMachineInstanceFileSystem): number =>
  fileSystem?.totalBytes;

export const getFileSystemUsedBytes = (fileSystem: V1VirtualMachineInstanceFileSystem): number =>
  fileSystem?.usedBytes;

// Selectors for V1VirtualMachineInstanceFileSystemInfo
export const getFileSystemInfoDisks = (
  fileSystemInfo: V1VirtualMachineInstanceFileSystemInfo,
): V1VirtualMachineInstanceFileSystem[] => fileSystemInfo?.disks;

// Selectors for V1VirtualMachineInstanceFileSystemList
export const getFileSystemListAPIVersion = (
  fileSystemList: V1VirtualMachineInstanceFileSystemList,
): string => fileSystemList?.apiVersion;

export const getFileSystemListItems = (
  fileSystemList: V1VirtualMachineInstanceFileSystemList,
): V1VirtualMachineInstanceFileSystem[] => fileSystemList?.items;
