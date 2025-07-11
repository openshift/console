import * as React from 'react';
import { useOLMv1Packages } from './useOLMv1API';

// Common operator categories based on the Openshift operator ecosystem
const OPERATOR_CATEGORY_MAPPINGS = {
  // Database categories
  database: ['Database', 'Big Data'],
  mysql: ['Database'],
  postgresql: ['Database'],
  mongodb: ['Database'],
  redis: ['Database'],
  elasticsearch: ['Database', 'Big Data'],

  // Monitoring & Observability
  monitoring: ['Monitoring'],
  prometheus: ['Monitoring'],
  grafana: ['Monitoring'],
  jaeger: ['Monitoring'],
  logging: ['Logging'],

  // Networking
  networking: ['Networking'],
  ingress: ['Networking'],
  loadbalancer: ['Networking'],
  service: ['Networking'],

  // Security
  security: ['Security'],
  authentication: ['Security'],
  authorization: ['Security'],
  vault: ['Security'],

  // Developer Tools
  ci: ['Developer Tools', 'Integration & Delivery'],
  cd: ['Developer Tools', 'Integration & Delivery'],
  cicd: ['Developer Tools', 'Integration & Delivery'],
  git: ['Developer Tools'],
  jenkins: ['Developer Tools', 'Integration & Delivery'],
  tekton: ['Developer Tools', 'Integration & Delivery'],

  // AI/ML
  ai: ['AI/ML'],
  ml: ['AI/ML'],
  'machine learning': ['AI/ML'],
  tensorflow: ['AI/ML'],
  pytorch: ['AI/ML'],

  // Storage
  storage: ['Storage'],
  backup: ['Storage'],

  // Application Runtime
  runtime: ['Application Runtime'],
  serverless: ['Application Runtime'],

  // Modernization & Migration
  migration: ['Modernization & Migration'],
  modernization: ['Modernization & Migration'],
};

interface ExtractedCategory {
  id: string;
  label: string;
  tags: string[];
  subcategories: string[];
  count: number;
}

const extractCategoriesFromPackage = (pkg: any): string[] => {
  const categories = new Set<string>();

  // 1. Extract from package name patterns
  const packageName = pkg.name?.toLowerCase() || '';
  for (const [keyword, cats] of Object.entries(OPERATOR_CATEGORY_MAPPINGS)) {
    if (packageName.includes(keyword)) {
      cats.forEach((cat) => categories.add(cat));
    }
  }

  // 2. Extract from package description
  const description = pkg.description?.toLowerCase() || '';
  for (const [keyword, cats] of Object.entries(OPERATOR_CATEGORY_MAPPINGS)) {
    if (description.includes(keyword)) {
      cats.forEach((cat) => categories.add(cat));
    }
  }

  // 3. Extract from bundle properties (if available)
  if (pkg.channels) {
    Object.values(pkg.channels || {}).forEach((channel: any) => {
      Object.values(channel.bundles || {}).forEach((bundle: any) => {
        // Extract from CSV metadata properties
        if (bundle.properties) {
          bundle.properties.forEach((prop: any) => {
            if (prop.type === 'olm.csv.metadata' && prop.value) {
              const csvMetadata =
                typeof prop.value === 'string' ? JSON.parse(prop.value) : prop.value;

              // Extract from keywords
              if (csvMetadata.keywords) {
                csvMetadata.keywords.forEach((keyword: string) => {
                  const keywordLower = keyword.toLowerCase();
                  for (const [key, cats] of Object.entries(OPERATOR_CATEGORY_MAPPINGS)) {
                    if (keywordLower.includes(key)) {
                      cats.forEach((cat) => categories.add(cat));
                    }
                  }

                  // Also add keyword directly if it looks like a category
                  const titleCaseKeyword = keyword
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                  if (keyword.length > 2 && keyword.length < 30) {
                    categories.add(titleCaseKeyword);
                  }
                });
              }

              // Extract from annotations
              if (csvMetadata.annotations) {
                const categoryAnnotation =
                  csvMetadata.annotations.categories ||
                  csvMetadata.annotations['alm-examples'] ||
                  csvMetadata.annotations['operatorframework.io/categories'];

                if (categoryAnnotation) {
                  try {
                    const cats = Array.isArray(categoryAnnotation)
                      ? categoryAnnotation
                      : JSON.parse(categoryAnnotation);
                    cats.forEach((cat: string) => categories.add(cat));
                  } catch {
                    // If not JSON, treat as comma-separated string
                    categoryAnnotation
                      .split(',')
                      .forEach((cat: string) => categories.add(cat.trim()));
                  }
                }
              }
            }
          });
        }
      });
    });
  }

  return Array.from(categories);
};

export const useExtensionCatalogCategories = () => {
  const { result, loaded, error } = useOLMv1Packages();

  const categories = React.useMemo(() => {
    if (!result || !result.packages) {
      return [];
    }

    // Extract categories from all packages
    const categoryCount = new Map<string, number>();

    // Process each package
    result.packages.forEach((pkg: any) => {
      const packageCategories = extractCategoriesFromPackage(pkg);

      packageCategories.forEach((category) => {
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });
    });

    // Convert to the expected format and sort by count
    const extractedCategories: ExtractedCategory[] = Array.from(categoryCount.entries())
      .map(([category, count]) => ({
        id: category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        label: category,
        tags: [category.toLowerCase()],
        subcategories: [],
        count,
      }))
      .sort((a, b) => b.count - a.count) // Sort by popularity
      .slice(0, 20); // Limit to top 20 categories

    // If no categories found, return default set
    if (extractedCategories.length === 0) {
      const defaultCategories = [
        'Database',
        'Monitoring',
        'Security',
        'Networking',
        'Storage',
        'Developer Tools',
        'Integration & Delivery',
        'AI/ML',
        'Application Runtime',
        'Modernization & Migration',
      ];

      return defaultCategories.map((category) => ({
        id: category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        label: category,
        tags: [category.toLowerCase()],
        subcategories: [],
        count: 0,
      }));
    }

    return extractedCategories;
  }, [result]);

  return {
    categories,
    loaded,
    error,
  };
};
