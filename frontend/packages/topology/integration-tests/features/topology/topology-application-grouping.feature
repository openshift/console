@topology
Feature: Application groupings in topology
              As a user, I want to check application groupings

        Background:
            Given user has installed OpenShift Serverless Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-topology-grouping"


        @smoke
        Scenario: Verify Application grouping sidebar: T-05-TC01
            Given user has created workload "nodejs-ex-git" in application grouping "nodejs-ex-git-app"
              And user is at the Topolgy page
             When user clicks on an applicaton grouping "nodejs-ex-git-app"
             Then user can see application sidebar
              And user is able to see workload "nodejs-ex-git" under resources tab in the sidebar
              And user can see Add to Application and Delete Application in the Action menu


        @smoke
        Scenario: Verify Application grouping context menu: T-05-TC02
            Given user has created workload "nodejs-ex-git" in application grouping "nodejs-ex-git-app"
              And user is at the Topolgy page
             When user right clicks on Application "nodejs-ex-git-app" to open context menu
             Then user can view Add to Application and Delete Application options


        @regression
        Scenario: Add to Application in Application grouping from Action menu: T-05-TC03
            Given user has created workload "nodejs-ex-git" in application grouping "nodejs-ex-git-app"
              And user is at the Topolgy page
             When user clicks on an applicaton grouping "nodejs-ex-git-app"
              And user clicks on Action menu and goes to Add to Application
              And user clicks on From Git
              And user fills the form and clicks Create
              And user clicks on Add to Project on Action menu and clicks on Container Image
              And user fills the form and clicks Create
              And user clicks on Add to Project on Action menu and clicks on From Dockerfile
              And user fills the form and clicks Create
              And user clicks on Add to Project on Action menu and clicks on From Devfile
              And user fills the form and clicks Create
              And user clicks on Add to Project on Action menu and clicks on From Event Source
              And user selects Api Server Source and clicks on Create Event Source
              And user fills the form and clicks Create
              And user clciks on Add to Project on Action menu and clicks on From Channel
              And user clicks on Create
             Then user can view options From Git, Container Image, From Dockerfile, From Devfile, Event Source, Channel


        @regression
        Scenario: Delete Application grouping from Action menu: T-05-TC04
            Given user has created workload "nodejs-ex-git" in application grouping "nodejs-ex-git-app"
              And user is at Topology page
             When user clicks on applicaton grouping "nodejs-ex-git-app"
              And user clicks on Action menu
              And user clicks on Delete Application
              And user enters the name "nodejs-ex-git-app" in the Delete Application modal and clicks on Delete button
             Then user can see the applicationgroup has been removed


        @regression
        Scenario: Delete Application grouping from context menu: T-05-TC05
            Given user has created workload "nodejs-ex-git" in application grouping "nodejs-ex-git-app"
             When user right clicks on applicaton grouping "nodejs-ex-git-app"
              And user clicks on Delete Application
              And user enters the name "nodejs-ex-git-app" in the Delete Application modal and clicks on Delete button
             Then user can see the applicationgroup has been removed
