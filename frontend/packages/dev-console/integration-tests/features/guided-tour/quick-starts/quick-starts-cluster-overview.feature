@guided-tour
Feature: Build with guided documentation card on cluster overview
              As a user, I should be able to access and discover Quick Starts from the Cluster Overview in the Administrator view

        Background:
            Given user is at administrator perspective
              And sample-application Quick Start CR is available
              And explore-serverless Quick Start CR is available
              And explore-pipeline Quick Start CR is available
              And add-healthchecks Quick Start CR is available


        @regression @to-do
        Scenario: Build with guided documentation card on Cluster Overview: QS-04-TC01
            Given user is at developer perspective
             When user switches to administrator perspective
              And user goes to Cluster Overview page
             Then user can see Build with guided documentation card
              And user can see two Quick Starts link present on it
              And user can see the "View all quick starts"


        @regression @to-do
        Scenario: Quick Starts links with status as in progress: QS-04-TC02
            Given user is at Cluster Overview page
             When user clicks on first Quick Starts link on the Build with guided documentation card
              And user clicks on the Start button
              And user clicks on close button
              And user clicks on Leave button in Leave quick start modal box
             Then user can see the first Quick Start link present


        @regression @to-do
        Scenario: Build with guided documentation card when one Quick Start has completed: QS-04-TC03
            Given user is at Cluster Overview page
             When user completes first Quick Starts from the card
             Then user can see completed Quick Starts link is replaced with another quick start link in the card


        @regression @to-do
        Scenario: Build with guided documentation card when all Quick Start has completed: QS-04-TC04
            Given user is at Cluster Overview page
             When user completes all the Quick Starts present
             Then user can see Build with guided documentation card is removed from the Cluster Overview page


        @regression @to-do
        Scenario: Remove Build with guided documentation card from Cluster Overview page: QS-04-TC05
            Given user is at Cluster Overview page
             When user clicks on the kebab menu at the Getting Started resources card
              And user clicks on Hide from the view
             Then Build with guided documentation card will be removed from Cluster Overview page


        @regression @to-do
        Scenario: Removed Build with guided documentation card from Cluster Overview page can be seen in Add page: QS-04-TC06
            Given user removed Build with guided documentation card from Cluster Overview page
             When user goes to developer perspective
              And user goes to Add page
             Then Build with guided documentation card will be displayed in Add page
