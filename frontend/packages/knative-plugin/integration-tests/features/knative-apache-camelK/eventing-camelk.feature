@knative-camelK
Feature: CamelK Connector Event Sources
    User should be able to install Connector Event Sources


    #Scenarios of installing these operator has been included in operators.feature file
        Background:
            Given user has installed Knative Apache Camelk Operator
              And user has created or selected namespace "aut-knative-camel-event-source"


        @smoke
        Scenario: CamelSource display in event sources add page - Kn-07-TC03
            Given user is at Add page
             When user clicks on "Event Sources" card
             Then user will be redirected to page with header name "Event Sources"
              And user is able to see CamelSource event type


        @regression
        Scenario: CamelK Connector Event Source cards
            Given user is at Developer perspective
             When user goes to +Add page
              And user clicks on the Event Sources card
             Then user will see the AWS 2 Simple Queue Service card
              And user will see Salesforce card
              And user will see AWS Kinesis card
              And user will see Jira card
              And user will see Slack card
              And user will see Telegram card


        @regression
        Scenario: Create AWS 2 Simple Queue Service connector
            Given user is at Event Sources page
             When user clicks on AWS Sqs card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see AWS Sqs connector


        @regression
        Scenario: Create Salesforce connector
            Given user is at Event Sources page
             When user clicks on Salesforce card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Salesforce connector


        @regression
        Scenario: Create AWS Kinesis connector
            Given user is at Event Sources page
             When user clicks on AWS Kinesis card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see AWS Kinesis connector


        @regression
        Scenario: Create Jira connector
            Given user is at Event Sources page
             When user clicks on Jira card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Jira connector


        @regression
        Scenario: Create Slack connector
            Given user is at Event Sources page
             When user clicks on Slack card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Slack connector


        @regression
        Scenario: Create Telegram connector
            Given user is at Event Sources page
             When user clicks on Telegram card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Telegram connector


        @regression @manual
        Scenario: Update YAML in the editor while installing CamelK Connector Event Source
            Given user is at Event Sources page
             When user clicks on Telegram card
              And user sees the YAML editor
              And user updates the metadata.name field in the YAML to TelegramConnector
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Telegram connector
