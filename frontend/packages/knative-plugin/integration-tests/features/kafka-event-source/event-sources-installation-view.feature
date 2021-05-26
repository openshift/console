@knative-camelK
Feature: Event Sources Installation View
              As a user, I should be able switch between YAML and Form view to install Event Sources


        Background:
            Given user has installed Knative Apache Camelk Integration Operator


        @regression @manual
        Scenario: Install Event Source from Developer Catalog Page using YAML View: KF-01-TC01
            Given user is at Add page
             When user clicks on the Developer Catalog card on the Add page
              And user clicks on Event Sources
              And user clicks on the Ping Source Event Source card
              And user clicks on the Create Event Source button on side bar
              And user selects YAML view
              And user updates YAML
              And user clicks on the Create button
             Then user will be redirected to Topology page
              And Topology page have the Event Source created


        @smoke
        Scenario: Install Event Source from Add Page using Form View: KF-01-TC02
            Given user is at Add page
              And user has created "hello-openshift" knative service
             When user clicks on the Event Source card on the Add page
              And user clicks on the Ping Source Event Source card
              And user clicks on the Create Event Source button on side bar
              And user selects Form view
              And user enters "* * * * *" in Schedule field
              And user selects Resource radio button
              And user selects "hello-openshift" as a resource
              And user clicks on the Create button
             Then user will be redirected to Topology page
              And Topology page have the Event Source created


        @regression
        Scenario: Switch from YAML to Form view: KF-01-TC03
            Given user is at the Create Event Source page
             When user selects the YAML View
              And user does some valid changes in the yaml for Event Source
              And user selects the Form view
             Then user will see that the data hasn't lost


        @regression @manual
        Scenario: Retain the data while switching the views: KF-01-TC04
            Given user is at the Create Event Source page
             When user selects the Form View
              And user does some changes in the form for Event Source
              And user selects the YAML view
              And user comes back to Form view
             Then user will see that the data hasn't lost
