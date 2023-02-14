# Contributing to Meteor React Native

Thanks for your interest in contributing!

### Contributing to `@meteorrn/core` and companion packages

All PRs must address **one** feature or issue, and may only modify **one** package (unless there is an issue/feature that absolutely requires an update across multiple packages). Before you submit a PR, please make sure to test your update on iOS and Android in release mode. For more info on testing, see Testing below

### Contributing to docs

All PRs must address **one** feature or issue, and may only modify **one** package (unless there is an issue/feature that absolutely requires an update across multiple packages).

# Testing

#### Real Device Testing

To test on a Real Android Device, you must build a release APK or release bundle (`./gradlew assembleRelease` or `./gradlew bundleRelease`).

To test on a Real iOS Device, you must build a release archive.

All code-level PRs must be tested on a real device, simulators/emulators are not sufficient.

Ondce you have your testing app installed on a device, use the following test cases depending on what features your update interacts with:

**All Updates:**

- Device with Internet Connection
- Device that is Offline

**Updates that interact with `AsyncStorage`, `NetInfo`, or `trackr`:**

- Opening from background (device put in sleep mode for at least 60 seconds, then reopened)

**Updates that interact with `NetInfo`:**

- Device is on WiFi
- Device is on Cellular
