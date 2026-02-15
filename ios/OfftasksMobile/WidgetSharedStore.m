#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <objc/message.h>

@interface WidgetSharedStore : NSObject <RCTBridgeModule>
@end

@implementation WidgetSharedStore

RCT_EXPORT_MODULE();

- (void)reloadWidgetTimelines
{
  if (@available(iOS 14.0, *)) {
    Class widgetCenterClass = NSClassFromString(@"WidgetCenter");
    if (widgetCenterClass == Nil) {
      return;
    }

    SEL sharedCenterSelector = NSSelectorFromString(@"sharedCenter");
    SEL reloadSelector = NSSelectorFromString(@"reloadAllTimelines");

    if (![widgetCenterClass respondsToSelector:sharedCenterSelector]) {
      return;
    }

    id center = ((id (*)(id, SEL))objc_msgSend)(widgetCenterClass, sharedCenterSelector);
    if (center != nil && [center respondsToSelector:reloadSelector]) {
      ((void (*)(id, SEL))objc_msgSend)(center, reloadSelector);
    }
  }
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_REMAP_METHOD(setSnapshot,
                 setSnapshot:(NSString *)snapshot
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.etlyn.offtasks"];
  if (defaults == nil) {
    reject(@"suite_unavailable", @"Could not access app group defaults", nil);
    return;
  }

  [defaults setObject:snapshot forKey:@"offtasks.widget.snapshot"];
  [defaults synchronize];

  [self reloadWidgetTimelines];

  resolve(@(YES));
}

RCT_REMAP_METHOD(clearSnapshot,
                 clearSnapshotWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.etlyn.offtasks"];
  if (defaults == nil) {
    reject(@"suite_unavailable", @"Could not access app group defaults", nil);
    return;
  }

  [defaults removeObjectForKey:@"offtasks.widget.snapshot"];
  [defaults synchronize];

  [self reloadWidgetTimelines];

  resolve(@(YES));
}

@end
