import { winToolsContainerNames } from '../../constants/vm/wintools';

export const isWinToolsImage = (image) => {
  const containerNames = winToolsContainerNames();
  return Object.values(containerNames).find((winTool) => image && image.startsWith(winTool));
};
