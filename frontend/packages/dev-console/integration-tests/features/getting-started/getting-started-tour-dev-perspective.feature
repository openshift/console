@getting-started @dev-console
Feature: Getting Started tour of developer perspective
              As a user I want to take tour of developer perspective

        @regression @manual
        Scenario: Quick tour when user logs in for the first time: GS-02-TC01
            Given user is on login page for the first time
             When user enters the credential
              And user clicks on the login button
              And user sees first screen as "Welcome to the Developer Perspective!"
              And user clicks on "Get Started"
              And user sees the next screen appears as "Perspective Switcher"
              And user clicks on 'Next' button
              And user sees the next screen appears as "Observe"
              And user clicks on 'Next' button
              And user sees the next screen appears as "Search"
              And user clicks on 'Next' button
              And user sees the next screen appears as "Help"
              And user clicks on 'Next' button
              And user sees the next screen appears as "User Preferences"
              And user clicks on 'Next' button
              And user sees the final screen appears as "You’re ready to go!"
              And user clicks on "Okay, got it!" button
             Then user is in the topology view in the developer perspective

        @regression
        Scenario: Quick tour from help menu: GS-02-TC02
            Given user is at developer perspective
             When user opens help menu on top right
              And user clicks on the 'Guided tour' option
              And user sees first screen as 'Welcome to the Developer Perspective!'
              And user clicks on the 'Get started' button on the guided tour modal
              And user sees the next screen appears as "Perspective Switcher"
              And user clicks on the 'Next' button
              And user sees the next screen appears as "Observe"
              And user clicks on the 'Next' button
              And user sees the next screen appears as "Search"
              And user clicks on the 'Next' button
              And user sees the next screen appears as "Help"
              And user clicks on the 'Next' button
              And user sees the next screen appears as "User Preferences"
              And user clicks on the 'Next' button
              And user sees the final screen appears as "You’re ready to go!"
              And user clicks on the "Okay, got it!" button on the guided tour modal
             Then user is in the topology view in the developer perspective

        @regression
        Scenario: Stopping Quick tour in mid of the tour: GS-02-TC03
            Given user is in developer perspective
             When user opens help menu on top right
              And user clicks on the "Guided tour" option
              And user sees first screen as "Welcome to the Developer Perspective!"
              And user clicks on Get started button
              And user sees the next screen appears as "Perspective Switcher"
              And user sees the button labels as "Back" & "Next" and "Close" button on top-right corner
              And user clicks on Close button
              And user is in the Add page in developer perspective
              And user opens help menu on top right
              And user clicks on the "Guided tour" option
             Then user is taken to the first screen again
