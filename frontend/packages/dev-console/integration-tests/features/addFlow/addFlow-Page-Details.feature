Feature: Create Application from git form
    As a user, I want to create the application, component or service from Add options

Background:
    Given user is at developer perspecitve


@regression
Scenario: Add page displays with message "No workloads found" fo newly created project : A-01-TC01
   Given user is at the new project namespace "aut-new-project-namespace"
   When user selects Add option from left side navigation menu
   Then user will be redirected to Add page
   And user is able to see message as "No workloads found"


@regression, @smoke
Scenario: Display of workloads in Add Page by default : A-01-TC02
   Given user is at Add page
   And user is at the new project namespace "aut-new-project-namespace"
   When user selects Add option from left side navigation menu
   Then user will be redirected to Add page
   And page contains From Git, Container Image, From Dockerfile, YAML, From Catalog, Database, Helm Chart cards


@regression
Scenario:  Pipeline card display on pipeline operator installation : A-02-TC01
   Given user has installed OpenShift Pipelines operator
   When user selects Add option from left side navigation menu
   Then user will be redirected to Add page
   And user is able to see Pipeline card on Git form


@regression
Scenario:  Operator Backed card display on serverless operator installation : A-02-TC01
   Given open shift cluster is installed with Serverless operator
   And user is at developer perspecitve
   And user is at the new project namespace "aut-new-project-namespace" 
   When user selects Add option from left side navigation menu
   Then user will be redirected to Add page
   And user is able to see "Operator Backed" card on Add page


@regression, @smoke
Scenario: Event Soruces card display on serverless operator installation : A-03-TC02
   Given open shift cluster is installed with Serverless operator
   And user is at developer perspecitve
   And user is at the new project namespace "aut-new-project-namespace" 
   When user selects Add option from left side navigation menu
   Then user will be redirected to Add page
   And user is able to see "Event Soruces" card on Add page
