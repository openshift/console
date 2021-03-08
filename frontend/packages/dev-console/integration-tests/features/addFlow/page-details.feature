@add-flow
Feature: Create Application from git form
              As a user, I want to create the application, component or service from Add options


        @smoke
        Scenario: Display of cards in Add Page : A-01-TC02
            Given user is at developer perspective
              And user is at Add page
              And user is at namespace "aut-namespace"
             When user selects Add option from left side navigation menu
             Then user will be redirected to Add page
              And page contains From Git, Container Image, From Dockerfile, YAML, From Catalog, Database, Helm Chart cards
