#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <UserNotifications/UserNotifications.h>

static NSString *const OfftasksReminderPrefix = @"com.etlyn.offtasks.reminder.";

@interface OfftasksReminders : NSObject <RCTBridgeModule>
@end

@implementation OfftasksReminders

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

static NSString *StatusName(UNAuthorizationStatus status)
{
  switch (status) {
    case UNAuthorizationStatusNotDetermined:
      return @"undetermined";
    case UNAuthorizationStatusDenied:
      return @"denied";
    default:
      return @"granted";
  }
}

RCT_REMAP_METHOD(getPermissionStatus,
                 getPermissionStatus:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter]
      getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
        resolve(StatusName(settings.authorizationStatus));
      }];
}

RCT_REMAP_METHOD(requestPermission,
                 requestPermission:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  UNAuthorizationOptions options = UNAuthorizationOptionAlert | UNAuthorizationOptionSound;
  [[UNUserNotificationCenter currentNotificationCenter]
      requestAuthorizationWithOptions:options
                    completionHandler:^(BOOL granted, NSError *error) {
                      if (error != nil) {
                        reject(@"permission_failed", error.localizedDescription, error);
                        return;
                      }
                      resolve(granted ? @"granted" : @"denied");
                    }];
}

// Replaces every pending Offtasks reminder with the supplied set. Each item is
// { id, title, body, fireAt } where fireAt is epoch milliseconds.
RCT_REMAP_METHOD(replaceReminders,
                 replaceReminders:(NSArray *)items
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];

  [center getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *pending) {
    NSMutableArray<NSString *> *stale = [NSMutableArray array];
    for (UNNotificationRequest *request in pending) {
      if ([request.identifier hasPrefix:OfftasksReminderPrefix]) {
        [stale addObject:request.identifier];
      }
    }
    [center removePendingNotificationRequestsWithIdentifiers:stale];

    NSDate *now = [NSDate date];
    NSCalendar *calendar = [NSCalendar currentCalendar];
    NSCalendarUnit units = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay |
                           NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
    dispatch_group_t group = dispatch_group_create();
    __block NSUInteger scheduled = 0;
    __block NSError *firstError = nil;
    NSObject *lock = [NSObject new];

    for (id item in items) {
      if (![item isKindOfClass:[NSDictionary class]]) {
        continue;
      }
      NSString *identifier = item[@"id"];
      NSNumber *fireAt = item[@"fireAt"];
      if (![identifier isKindOfClass:[NSString class]] || identifier.length == 0 ||
          ![fireAt isKindOfClass:[NSNumber class]]) {
        continue;
      }
      NSDate *fireDate = [NSDate dateWithTimeIntervalSince1970:fireAt.doubleValue / 1000.0];
      if ([fireDate timeIntervalSinceDate:now] <= 1) {
        continue;
      }

      UNMutableNotificationContent *content = [UNMutableNotificationContent new];
      content.title = [item[@"title"] isKindOfClass:[NSString class]] ? item[@"title"] : @"Reminder";
      content.body = [item[@"body"] isKindOfClass:[NSString class]] ? item[@"body"] : @"";
      content.sound = [UNNotificationSound defaultSound];
      content.threadIdentifier = @"offtasks.reminders";
      content.userInfo = @{@"taskId" : identifier};

      NSDateComponents *components = [calendar components:units fromDate:fireDate];
      UNCalendarNotificationTrigger *trigger =
          [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:components repeats:NO];
      UNNotificationRequest *request =
          [UNNotificationRequest requestWithIdentifier:[OfftasksReminderPrefix stringByAppendingString:identifier]
                                               content:content
                                               trigger:trigger];

      dispatch_group_enter(group);
      [center addNotificationRequest:request
               withCompletionHandler:^(NSError *error) {
                 @synchronized(lock) {
                   if (error != nil) {
                     firstError = firstError ?: error;
                   } else {
                     scheduled += 1;
                   }
                 }
                 dispatch_group_leave(group);
               }];
    }

    dispatch_group_notify(group, dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
      if (firstError != nil && scheduled == 0) {
        reject(@"schedule_failed", firstError.localizedDescription, firstError);
      } else {
        resolve(@(scheduled));
      }
    });
  }];
}

@end
