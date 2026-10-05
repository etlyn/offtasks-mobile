import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications
import WidgetKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    UNUserNotificationCenter.current().delegate = self

    factory.startReactNative(
      withModuleName: "OfftasksMobile",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // Reminders that fire while the app is open still show as a banner.
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    completionHandler([.banner, .list, .sound])
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

@objc(WidgetReloadHelper)
class WidgetReloadHelper: NSObject {
  @objc static func reloadOfftasksWidget() {
    guard #available(iOS 14.0, *) else {
      return
    }

    let widgetCenter = WidgetCenter.shared
    widgetCenter.reloadTimelines(ofKind: "OfftasksWidget")
    widgetCenter.reloadAllTimelines()
  }
}
