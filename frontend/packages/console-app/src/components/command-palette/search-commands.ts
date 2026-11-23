import * as fuzzy from 'fuzzysearch';
import { COMMAND_GROUPS } from './command-groups';
import type {
  CommandPaletteCommand,
  CommandPaletteCommandType,
  CommandPaletteGroup,
} from './types';

export const MAX_RESULTS_PER_GROUP = 8;

const GROUP_ORDER: CommandPaletteCommandType[] = COMMAND_GROUPS.map(({ type }) => type);

const isWordChar = (char: string): boolean => /[\p{L}\p{N}]/u.test(char);

const hasWordStartMatch = (text: string, query: string): boolean => {
  let index = text.indexOf(query, 1);

  while (index > 0) {
    if (!isWordChar(text[index - 1])) {
      return true;
    }

    index = text.indexOf(query, index + 1);
  }

  return false;
};

type SearchText = {
  title: string;
  aliases: string[];
  keywords: string[];
};

const MATCHERS_BY_RANK: ((text: SearchText, query: string) => boolean)[] = [
  ({ title }, query) => title === query,
  ({ aliases }, query) => aliases.includes(query),
  ({ title }, query) => title.startsWith(query),
  ({ title }, query) => hasWordStartMatch(title, query),
  ({ title }, query) => title.includes(query),
  ({ aliases, keywords }, query) =>
    [...aliases, ...keywords].some((term) => term.startsWith(query)),
  ({ title }, query) => fuzzy(query, title),
];

const toLowerCaseTerms = (terms: string[]): string[] => terms.map((term) => term.toLowerCase());

const getMatchRank = (command: CommandPaletteCommand, query: string): number => {
  const text: SearchText = {
    title: command.title.toLowerCase(),
    aliases: toLowerCaseTerms(command.aliases),
    keywords: toLowerCaseTerms(command.keywords),
  };

  return MATCHERS_BY_RANK.findIndex((matches) => matches(text, query));
};

const isActivePerspectivePage = (
  command: CommandPaletteCommand,
  activePerspective: string,
): boolean => command.type === 'page' && command.perspective === activePerspective;

const groupCommands = (
  commands: CommandPaletteCommand[],
  types: CommandPaletteCommandType[],
  limit: number,
): CommandPaletteGroup[] =>
  types
    .map((type) => ({
      type,
      commands: commands.filter((command) => command.type === type).slice(0, limit),
    }))
    .filter((group) => group.commands.length > 0);

export const searchCommands = (
  commands: CommandPaletteCommand[],
  query: string,
  activePerspective: string,
): CommandPaletteGroup[] => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return groupCommands(
      commands.filter((command) => isActivePerspectivePage(command, activePerspective)),
      GROUP_ORDER,
      Infinity,
    );
  }

  const ranked = commands
    .map((command) => ({ command, rank: getMatchRank(command, normalizedQuery) }))
    .filter(({ rank }) => rank >= 0)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        GROUP_ORDER.indexOf(a.command.type) - GROUP_ORDER.indexOf(b.command.type) ||
        Number(isActivePerspectivePage(b.command, activePerspective)) -
          Number(isActivePerspectivePage(a.command, activePerspective)) ||
        a.command.title.length - b.command.title.length ||
        a.command.title.localeCompare(b.command.title),
    );

  const rankedCommands = ranked.map(({ command }) => command);

  const typesByBestMatch = [...new Set(rankedCommands.map((command) => command.type))];

  return groupCommands(rankedCommands, typesByBestMatch, MAX_RESULTS_PER_GROUP);
};
