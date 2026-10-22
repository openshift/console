import { customizeValidator } from '@rjsf/validator-cfworker';

// Runtime schemas need validation without AJV code generation, which requires CSP unsafe-eval.
// Draft 7 matches the Helm chart schemas and the previous RJSF validator.
export const dynamicFormValidator = customizeValidator({ draft: '7' });
