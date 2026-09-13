#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

@interface OfftasksBlurView : UIView
@property(nonatomic, assign) BOOL dark;
@property(nonatomic, assign) CGFloat intensity;
@property(nonatomic, strong) UIViewPropertyAnimator *blurAnimator;
@property(nonatomic, strong) UIVisualEffectView *material;
@end

@implementation OfftasksBlurView
- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _intensity = 1;
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
- (void)setIntensity:(CGFloat)intensity
{
  _intensity = MAX(0, MIN(1, intensity));
  [self updateMaterial];
}
- (void)updateMaterial
{
  [_blurAnimator stopAnimation:YES];
  _blurAnimator = nil;
  self.overrideUserInterfaceStyle = _dark ? UIUserInterfaceStyleDark : UIUserInterfaceStyleLight;
  if (UIAccessibilityIsReduceTransparencyEnabled()) {
    _material.effect = nil;
    self.backgroundColor = _dark ? [UIColor colorWithWhite:0.10 alpha:1] : UIColor.whiteColor;
  } else {
    self.backgroundColor = UIColor.clearColor;
    if (_intensity >= 1) {
      _material.effect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleSystemThinMaterial];
    } else {
      // A partial plain blur, without the opaque system-material wash.
      _material.effect = nil;
      __weak OfftasksBlurView *weakSelf = self;
      _blurAnimator = [[UIViewPropertyAnimator alloc] initWithDuration:1 curve:UIViewAnimationCurveLinear animations:^{
        weakSelf.material.effect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleRegular];
      }];
      _blurAnimator.fractionComplete = _intensity;
    }
  }
}
- (void)layoutSubviews
{
  [super layoutSubviews];
  BOOL changed = !CGRectEqualToRect(_material.frame, self.bounds);
  _material.frame = self.bounds;
  if (changed && self.window && _intensity < 1) [self updateMaterial];
}
- (void)didMoveToWindow
{
  [super didMoveToWindow];
  // UIKit can rebuild the effect at full strength when attaching to a window.
  // Establish partial blur only after the material has its real backdrop.
  if (self.window && _intensity < 1) [self updateMaterial];
}
- (void)dealloc
{
  [_blurAnimator stopAnimation:YES];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}
@end

@interface OfftasksBlurManager : RCTViewManager
@end
@implementation OfftasksBlurManager
RCT_EXPORT_MODULE(OfftasksBlur)
RCT_EXPORT_VIEW_PROPERTY(dark, BOOL)
RCT_EXPORT_VIEW_PROPERTY(intensity, CGFloat)
- (UIView *)view { return [OfftasksBlurView new]; }
@end
