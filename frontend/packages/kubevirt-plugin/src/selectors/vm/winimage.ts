import { winToolsContainerNames } from '../../constants/vm/wintools';

export const isWinToolsImage = (
  image: string,
  windowsImages?: {
    [key: string]: string;
  },
) => {
  const containerNames = winToolsContainerNames(windowsImages);
  return Object.values(containerNames).find(
    (winTool) => image && image.startsWith(winTool as string),
  );
};
