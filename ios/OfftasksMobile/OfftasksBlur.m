#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

@interface OfftasksBlurView : UIView
@property(nonatomic, assign) BOOL dark;
@property(nonatomic, strong) UIVisualEffectView *material;
@end

@implementation OfftasksBlurView
- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _material = [[UIVisualEffectView alloc] initWithEffect:nil];
    _material.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_material];
    self.userInteractionEnabled = NO;
    [[NSNotificationCenter defaultCenter] addObserver:self
      selector:@selector(updateMaterial)
      name:UIAccessibilityReduceTransparencyStatusDidChangeNotification object:nil];
    [self updateMaterial];
  }
  return self;
}
- (void)setDark:(BOOL)dark
{
  _dark = dark;
  [self updateMaterial];
}
- (void)updateMaterial
{
  self.overrideUserInterfaceStyle = _dark ? UIUserInterfaceStyleDark : UIUserInterfaceStyleLight;
  if (UIAccessibilityIsReduceTransparencyEnabled()) {
    _material.effect = nil;
    self.backgroundColor = _dark ? [UIColor colorWithWhite:0.10 alpha:1] : UIColor.whiteColor;
  } else {
    self.backgroundColor = UIColor.clearColor;
    _material.effect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleSystemThinMaterial];
  }
}
- (void)layoutSubviews
{
  [super layoutSubviews];
  _material.frame = self.bounds;
}
- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}
@end

@interface OfftasksBlurManager : RCTViewManager
@end
@implementation OfftasksBlurManager
RCT_EXPORT_MODULE(OfftasksBlur)
RCT_EXPORT_VIEW_PROPERTY(dark, BOOL)
- (UIView *)view { return [OfftasksBlurView new]; }
@end
