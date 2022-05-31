@knative-camelk
Feature: CamelK Connector Event Sources
    User should be able to install Connector Event Sources


    #Scenarios of installing these operator has been included in operators.feature file
        Background:
            Given user has installed Red Hat Integration - Camel K Operator
              And user has created or selected namespace "aut-knative-camel-event-source"


        @smoke
        Scenario: Kamelets display in event sources add page: KC-02-TC01
            Given user is at Add page
             When user clicks on Event Sources card
             Then user will be redirected to page with header name "Event Sources"
              And user is able to see multiple sources of the kind kamelets


        @regression
        Scenario: CamelK Connector Event Source cards: KC-02-TC02
            Given user is at developer perspective
             When user is at Add page
              And user clicks on Event Sources card
             Then user will see the "AWS SQS Source" card
              And user will see the "Salesforce Source" card
              And user will see the "AWS Kinesis Source" card
              And user will see the "Jira Source" card
              And user will see the "Slack Source" card
              And user will see the "Telegram Source" card


        @regression
        Scenario: Create AWS 2 Simple Queue Service connector: KC-02-TC03
            Given user is at Event Sources page
             When user clicks on the "AWS SQS Source" card
              And user creates "AWS SQS Source"
             Then user will be redirected to Topology page
              And user will see "aws-sqs" connector


        @regression
        Scenario: Create Salesforce connector: KC-02-TC04
            Given user is at Event Sources page
             When user clicks on the "Salesforce Source" card
              And user creates "Salesforce Source"
             Then user will be redirected to Topology page
              And user will see "salesforce" connector


        @regression
        Scenario: Create AWS Kinesis connector: KC-02-TC05
            Given user is at Event Sources page
             When user clicks on the "AWS Kinesis Source" card
              And user creates "AWS Kinesis Source"
             Then user will be redirected to Topology page
              And user will see "aws-kinesis" connector


        @regression
        Scenario: Create Jira connector: KC-02-TC06
            Given user is at Event Sources page
             When user clicks on the "Jira Source" card
              And user creates "Jira Source"
             Then user will be redirected to Topology page
              And user will see "jira" connector


        @regression
        Scenario: Create Slack connector: KC-02-TC07
            Given user is at Event Sources page
             When user clicks on the "Slack Source" card
              And user creates "Slack Source"
             Then user will be redirected to Topology page
              And user will see "slack" connector


        @regression
        Scenario: Create Telegram connector: KC-02-TC08
            Given user is at Event Sources page
             When user clicks on the "Telegram Source" card
              And user creates "Telegram Source"
             Then user will be redirected to Topology page
              And user will see "telegram" connector


        @regression @manual
        Scenario: Update YAML in the editor while installing CamelK Connector Event Source: KC-02-TC09
            Given user is at Event Sources page
             When user clicks on Telegram card
              And user sees the YAML editor
              And user updates the metadata.name field in the YAML to TelegramConnector
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see Telegram connector
