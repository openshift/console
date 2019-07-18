import { Extension, isPerspective } from './typings';

/**
 * Registry used to query for Console extensions.
 *
 * TODO(vojtech): legacy, remove
 */
export class ExtensionRegistry {
  // eslint-disable-next-line no-empty-function
  public constructor(private readonly extensions: Extension[]) {}

  public getPerspectives() {
    return this.extensions.filter(isPerspective);
  }
}
