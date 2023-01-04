import { BaseService } from '../services/base-service';

export const detectPacFiles = async (gitService: BaseService) => {
  let pacFiles = [];
  const isTektonFolderPresent = await gitService.isTektonFolderPresent();

  if (isTektonFolderPresent) {
    pacFiles.push('.tekton');
    const { files: pipelineFiles } = await gitService.getRepoFileList({
      specificPath: '.tekton',
      includeFolder: true,
    });
    if (pipelineFiles.length > 0) {
      pacFiles = [...pacFiles, ...pipelineFiles];
    }
  }
  return pacFiles;
};

export const verifyPipelinesFile = async (file: string, gitService: BaseService) => {
  const trimmedFile = file?.startsWith('.tekton/') ? file?.replace('.tekton/', '') : file;

  const resourceContent = await gitService.getFileContent(`.tekton/${trimmedFile}`);
  return resourceContent?.split(/\r?\n/).includes('kind: PipelineRun');
};

export const isPipelineFilePresent = async (
  pacFiles: string[],
  gitService: BaseService,
): Promise<boolean> => {
  if (!pacFiles || pacFiles?.length === 0) {
    return false;
  }
  for await (const pacFile of pacFiles) {
    if (pacFile?.endsWith('.yaml') || pacFile?.endsWith('.yml')) {
      if (await verifyPipelinesFile(pacFile, gitService)) {
        return true;
      }
    }
  }
  return false;
};

export const isPacRepository = async (
  isRepositoryEnabled: boolean,
  gitService: BaseService,
  pacFiles: string[],
): Promise<boolean> => {
  if (!pacFiles || pacFiles?.length === 0) {
    return false;
  }
  const isKindPipelineRunPresent = await isPipelineFilePresent(pacFiles, gitService);

  return (
    isRepositoryEnabled &&
    gitService &&
    gitService.isTektonFolderPresent &&
    isKindPipelineRunPresent
  );
};
