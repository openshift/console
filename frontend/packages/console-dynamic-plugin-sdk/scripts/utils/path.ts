import * as path from 'path';

export const resolvePath = (to: string) => path.resolve(process.cwd(), to);

export const relativePath = (to: string) => path.relative(process.cwd(), to);
