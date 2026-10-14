import * as fs from 'fs';

export const deleteFile = (filePath: string) => {
  try {
    fs.unlinkSync(filePath);
  } catch (e) {
    console.error(`Failed to delete file ${filePath}:`, e);
  }
};
