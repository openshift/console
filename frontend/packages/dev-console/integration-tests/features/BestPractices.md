# Gherkin Scenarios designing Best Practices

1. use scenario outlines instead of scenarios in our entire project
2. Scenario description - should start with capital letter
3. "Given, When, And, Then, But" related descriptions - should start with small letter
4. All parameter names shoud be wrapped with "<>" angular braces
5. label names and popup header names should wrap inside "" double quotes
6. Try to reuse the steps in scenarios as much as possible

## Inlcude Extensions

    "alexkrechik.cucumberautocomplete",
    "dylanmoerland.cypress-cucumber-steps"
