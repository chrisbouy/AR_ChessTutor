#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

#import "RNSplashScreen.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"ChessTutorAR";
  self.initialProps = @{};

  // Call the super method first to initialize React Native
  BOOL result = [super application:application didFinishLaunchingWithOptions:launchOptions];

  // Show the splash screen after initialization
  //[RNSplashScreen show];

  return result;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
