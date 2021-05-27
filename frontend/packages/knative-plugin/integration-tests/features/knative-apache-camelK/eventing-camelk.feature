@knative-camelK
Feature: CamelK Connector Event Sources
    User should be able to install Connector Event Sources


    #Scenarios of installing these operator has been included in operators.feature file
        Background:
            Given user has installed Knative Apache Camelk Operator
              And user has created or selected namespace "aut-knative-camel-event-source"


        @smoke
        Scenario: CamelSource display in event sources add page: KC-02-TC01
            Given user is at Add page
             When user clicks on "Event Sources" card
             Then user will be redirected to page with header name "Event Sources"
              And user is able to see CamelSource event type


        @regression @to-do
        Scenario: CamelK Connector Event Source cards: KC-02-TC02
            Given user is at Developer perspective
             When user goes to +Add page
              And user clicks on the Event Sources card
             Then user will see the AWS 2 Simple Queue Service card
              And user will see Salesforce card
              And user will see AWS Kinesis card
              And user will see Jira card
              And user will see Slack card
              And user will see Telegram card


        @regression @to-do
        Scenario: Create AWS 2 Simple Queue Service connector: KC-02-TC03
            Given user is at Event Sources page
             When user clicks on AWS Sqs card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see AWS Sqs connector


        @regression
        Scenario: Create Salesforce connector: KC-02-TC04
            Given user is at Event Sources page
             When user clicks on Salesforce card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Salesforce connector


        @regression
        Scenario: Create AWS Kinesis connector: KC-02-TC05
            Given user is at Event Sources page
             When user clicks on AWS Kinesis card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see AWS Kinesis connector


        @regression
        Scenario: Create Jira connector: KC-02-TC06
            Given user is at Event Sources page
             When user clicks on Jira card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Jira connector


        @regression
        Scenario: Create Slack connector: KC-02-TC07
            Given user is at Event Sources page
             When user clicks on Slack card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Slack connector


        @regression
        Scenario: Create Telegram connector: KC-02-TC08
            Given user is at Event Sources page
             When user clicks on Telegram card
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Telegram connector


        @regression @manual
        Scenario: Update YAML in the editor while installing CamelK Connector Event Source: KC-02-TC09
            Given user is at Event Sources page
             When user clicks on Telegram card
              And user sees the YAML editor
              And user updates the metadata.name field in the YAML to TelegramConnector
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Telegram connector
