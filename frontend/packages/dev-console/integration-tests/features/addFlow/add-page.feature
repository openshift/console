@add-flow
Feature: Add page on Developer Console
              As a user, I should be able select a way to create an Application, component or service from one of the options provided on Add page


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-verify-add-page"
              And user is at Add page


        @regression @to-do
        Scenario: Getting started resources on Developer perspective: A-11-TC01
             Then user will see Getting started resources
              And user will see Create Application using Samples
              And user will see Build with guided documentation
              And user will see Explore new developer features


        @regression
        Scenario: Options to create an Application, Component or Service: A-11-TC02
             Then user will see "Developer Catalog" card
              And user will see "Git Repository" card
              And user will see "Container images" option
              And user will see "Samples" option
              And user will see "From Local Machine" card


        @regression @to-do
        Scenario: Developer Catalog option to create an Application, Component or Service: A-11-TC03
             Then user will see "All services" option
              And user will see "Database" option
              And user will see "Operator Backed" option
              And user will see "Helm Chart" option


        @regression @to-do
        Scenario: Git Repository option to create an Application, Component or Service: A-11-TC04
             Then user will see "From Git" option
              And user will see "From Devfile" option
              And user will see "From Dockerfile" option


        @regression @to-do
        Scenario: From Local Machine option to create an Application, Component or Service: A-11-TC05
             Then user will see "Import YAML" option
              And user will see "Upload JAR file" option


        @smoke
        Scenario: Hide Getting Started Resources from View: A-11-TC06
            Given user has hidden Getting Started Resources from View
             When user selects Hide from view option from kebab menu
             Then user will not see Getting started resources card


        @smoke
        Scenario: Show Getting Started Resources: A-11-TC07
             When user clicks on Show getting started resources link
             Then user will see Getting started resources card


        @smoke @manual
        Scenario: Close Show Getting Started Resources link: A-11-TC08
             When user selects Hide from view option from kebab menu
              And user clicks on close Show getting started resources link
             Then user will not see Show getting started resources link


        @regression
        Scenario: Details Toggle on: A-11-TC09
             When user enable Details toggle
             Then user will see label Details on
              And user will see description of each option on each card


        @regression
        Scenario: Details Toggle off: A-11-TC10
             When user disable Details toggle
             Then user will see label Details off
              And user will not see description of option on cards


        @regression @manual
        Scenario: Getting Started Resources card when all Quick Starts have been completed: A-11-TC11
            Given user has completed all Quick Starts
             Then user will not see Build with guided documentation at Developer perspective on getting started resources card
              And user will not see Build with guided documentation at Administrator perspective on getting started resources card
