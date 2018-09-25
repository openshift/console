/* eslint-disable no-undef */
import * as _ from 'lodash-es';

const catalogCategories: any[] = [
  {id: 'all', label: 'All Categories'},
  {
    id: 'languages',
    label: 'Languages',
    subcategories: [
      {id: 'java', label: 'Java', tags: ['java']},
      {id: 'javascript', tags: ['javascript', 'nodejs', 'js'], label: 'JavaScript'},
      {id: 'dotnet', label: '.NET', tags: ['dotnet']},
      {id: 'perl', label: 'Perl', tags: ['perl']},
      {id: 'ruby', label: 'Ruby', tags: ['ruby']},
      {id: 'php', label: 'PHP', tags: ['php']},
      {id: 'python', label: 'Python', tags: ['python']},
      {id: 'golang', label: 'Go', tags: ['golang', 'go']},
    ],
  },
  {
    id: 'databases',
    label: 'Databases',
    subcategories: [
      {id: 'mongodb', label: 'Mongo', tags: ['mongodb']},
      {id: 'mysql', label: 'MySQL', tags: ['mysql']},
      {id: 'postgresql', label: 'Postgres', tags: ['postgresql']},
      {id: 'mariadb', label: 'MariaDB', tags: ['mariadb']},
    ],
  },
  {
    id: 'middleware',
    label: 'Middleware',
    subcategories: [
      {id: 'integration', label: 'Integration', tags: ['amq', 'fuse', 'jboss-fuse', 'sso', '3scale']},
      {id: 'process-automation', label: 'Process Automation', tags: ['decisionserver', 'processserver']},
      {id: 'analytics-data', label: 'Analytics & Data', tags: ['datagrid', 'datavirt']},
      {id: 'runtimes', label: 'Runtimes & Frameworks', tags: ['eap', 'httpd', 'tomcat']},
    ],
  },
  {
    id: 'cicd',
    label: 'CI/CD',
    subcategories: [
      {id: 'jenkins', label: 'Jenkins', tags: ['jenkins']},
      {id: 'pipelines', label: 'Pipelines', tags: ['pipelines']},
    ],
  },
  {
    id: 'virtualization',
    label: 'Virtualization',
    subcategories: [
      {id: 'vms', label: 'Virtual Machines', tags: ['virtualmachine']},
    ],
  },
  {id: 'other', label: 'Other'},
];

const hasMatchingTags = (tagsOne: string[], tagsTwo: string[]) => {
  return _.some(tagsOne, (tagOne) => {
    const tagOneLower = tagOne.toLowerCase();
    return _.some(tagsTwo, (tagTwo) => tagOneLower === tagTwo.toLowerCase());
  });
};

const filterSubcategoriesByTags = (subCats: any[], tags: string[]): any[] => {
  return _.filter(subCats, (subCat) => hasMatchingTags(subCat.tags, tags));
};

// categorize item under sub and main categories
const addItem = (item, category, subcategory = null) => {
  if (subcategory) {
    subcategory.parentCategory = category.id;
    subcategory.items = (subcategory.items || []).concat(item);
  }
  category.items = category.items && !_.some(category.items, { id: item.id }) ? category.items.concat(item) : [item];
};

const sortItems = (items: any[]) => _.sortBy(items, 'tileName');
const isCategoryEmpty = ({items}) => _.isEmpty(items);

const pruneCategoriesWithNoItems = (categories: any[]) => {
  _.remove(categories, isCategoryEmpty);
  _.each(categories, category => _.remove(category.subcategories, isCategoryEmpty));
};

// calculate numItems per Category and subcategories, sort items
const processCategories = (categories: any[]) => {
  _.each(categories, (category) => {
    if (category.items) {
      category.numItems = _.size(category.items);
      category.items = sortItems(category.items);
    }
    _.each(category.subcategories, (subcategory) => {
      if (subcategory.items) {
        subcategory.numItems = _.size(subcategory.items);
        subcategory.items = sortItems(subcategory.items);
      }
    });
  });
};

const clearItemsFromCategories = (categories: any[]) => {
  _.each(categories, (category) => {
    category.numItems = 0;
    category.items = [];
    _.each(category.subcategories, (subcategory) => {
      subcategory.numItems = 0;
      subcategory.items = [];
    });
  });
};

export const categorize = (items: any[], categories: any[]) => {
  const allCategory = _.first(categories);
  const otherCategory = _.last(categories);

  // Categorize each item
  _.each(items, item => {
    let itemCategorized = false;
    _.each(categories, (category) => {
      const matchedSubcategories = filterSubcategoriesByTags(category.subcategories, item.tags);
      _.each(matchedSubcategories, (subcategory) => {
        addItem(item, category, subcategory); // add to subcategory & main category
        itemCategorized = true;
      });
    });
    if (!itemCategorized) {
      addItem(item, otherCategory); // add to Other category
    }
  });

  allCategory.items = items;
  allCategory.numItems = _.size(items);
  return categories;
};

/**
 * Creates an items array under each category and subcategory.  If no match, categorizes item
 * under 'Other' main category.
 */
export const categorizeItems = (items: any[]) => {
  const categories = _.cloneDeep(catalogCategories);
  categorize(items, categories);
  pruneCategoriesWithNoItems(categories);
  processCategories(categories);
  return categories;
};

export const recategorizeItems = (items: any[], categories: any[]) => {
  const newCategories = _.cloneDeep(categories);
  clearItemsFromCategories(newCategories);
  categorize(items, newCategories);
  processCategories(newCategories);
  return newCategories;
};


