@guided-tour @dev-console
Feature: Build with guided documentation card on cluster overview
              As a user, I should be able to access and discover Quick Starts from the Cluster Overview in the Administrator view

        Background:
            Given user is at administrator perspective


        @regression
        Scenario: Build with guided documentation card on Cluster Overview: QS-04-TC01
            Given user is at developer perspective
             When user switches to administrator perspective
              And user goes to Cluster Overview page
             Then user can see Build with guided documentation card
              And user can see two Quick Starts link present on it
              And user can see the "View all quick starts" on the card


        @regression
        Scenario: Quick Starts links with status as in progress: QS-04-TC02
            Given user is at Cluster Overview page
             When user clicks on first Quick Starts link on the Build with guided documentation card
              And user clicks on the Start button
              And user clicks on close button
              And user clicks on Leave button in Leave quick start modal box
             Then user can see the first Quick Starts link


        @regression
        Scenario: Build with guided documentation card when one Quick Start has completed: QS-04-TC03
            Given user is at Cluster Overview page
             When user completes first Quick Starts from the card
             Then user can see completed Quick Starts link is replaced with another quick start link in the card


        @regression @manual
        Scenario: Build with guided documentation card when all Quick Start has completed: QS-04-TC04
            Given user is at Cluster Overview page
             When user completes all the Quick Starts present
             Then user can see Build with guided documentation card is removed from the Cluster Overview page

