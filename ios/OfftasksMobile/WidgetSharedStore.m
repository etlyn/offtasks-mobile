#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import "OfftasksMobile-Swift.h"

@interface WidgetSharedStore : NSObject <RCTBridgeModule>
@end

@implementation WidgetSharedStore

RCT_EXPORT_MODULE();

- (void)reloadWidgetTimelines
{
  [WidgetReloadHelper reloadOfftasksWidget];
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

RCT_REMAP_METHOD(setThemeMode,
                 setThemeMode:(NSString *)themeMode
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.etlyn.offtasks"];
  if (defaults == nil) {
    reject(@"suite_unavailable", @"Could not access app group defaults", nil);
    return;
  }

  [defaults setObject:themeMode forKey:@"offtasks.widget.theme-mode"];
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
