Feature: Add Quick Starts card on cluster overview
              As a user, I should be able to access and discover Quick Starts from the Cluster Overview in the Administrator view

        Background:
            Given user is at administrator perspective
              And sample-application Quick Start CR is available
              And explore-serverless Quick Start CR is available
              And explore-pipeline Quick Start CR is available
              And add-healthchecks Quick Start CR is available


        @regression
        Scenario: Quick Starts card on Cluster Overview: QS-04-TC01
            Given user is in administrator perspective
             When user goes to Cluster Overview page
             Then user can see Quick Starts card
              And user can see three Quick Starts link present on it
              And user can see the "View all Quick Starts"
              And user can see the kebab menu on top right of the card


        @regression
        Scenario: Quick Starts links with status as in progress: QS-04-TC02
            Given user is at Cluster Overview page
             When user clicks on first Quick Starts link on the Quick Starts card
              And user clicks on the Start tour
              And user clicks on close button
              And user clicks on leave on leave the tour modal box
             Then user can see "In Progress" status below the first Quick Starts link


        @regression
        Scenario: Quick Starts card when one Quick Starts has completed: QS-04-TC03
            Given user is at Cluster Overview page
             When user completes first Quick Starts from the card
             Then user can see completed Quick Starts link is removed from the card


        @regression
        Scenario: Quick Starts card when all Quick Starts has completed: QS-04-TC04
            Given user is at Cluster Overview page
             When user completes all the Quick Starts present
             Then user can see Quick Starts card is removed from the Cluster Overview page


        @regression
        Scenario: Remove Quick Starts card from Cluster Overview page: QS-04-TC05
            Given user is at Cluster Overview page
             When user clicks on the kebab menu at the Quick Starts card
              And user clicks on Remove Quick Starts card from the view
             Then Quick Starts card will be removed from Cluster Overview page


        @regression
        Scenario: Removed Quick Starts card from Cluster Overview page can be seen in Add page: QS-04-TC06
            Given user removed Quick Starts card from Cluster Overview page
             When user goes to developer perspective
              And user goes to Add page
             Then Quick Starts card will be displayed in Add page
