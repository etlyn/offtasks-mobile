@e2e @mobile @account
# Feature code: 9
Feature: Mobile account controls
    The authenticated drawer should expose account identity, app metadata, and session controls.

    Background:
        Given the tester is signed in to the mobile app

    # Scenario code: 9.1
    Scenario: Review account information from the drawer
        When the tester opens the navigation drawer
        Then the drawer should show the signed-in email address or profile label
        And the drawer should show the current completion count

    # Scenario code: 9.2
    Scenario: Review app metadata from the drawer
        When the tester opens the navigation drawer
        Then the drawer should display the current app version
        And the version should match the build under test

    # Scenario code: 9.3
    Scenario: Sign out from account controls
        Given the navigation drawer is open
        When the tester presses Log Out
        Then the current session should be cleared
        And the app should return to the authentication screen