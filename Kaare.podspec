Pod::Spec.new do |s|
  s.name          = "Kaare"
  s.version       = "0.0.1"
  s.summary       = "Cross platform reactive communication channel between JavaScript and native code"
  s.description   = "Kaare allows communication between native code and JavaScript inside JavaScriptCore, UIWebView or even static HTML page"
  s.homepage      = "https://github.com/artemyarulin/Kaare"
  s.license       = { :type => 'MIT', :file => 'LICENSE' }
  s.author        = { "Artem Yarulin" => "artem.yarulin@fessguid.com" }
  s.platform      = :ios, "7.0"
  s.source        = { :git => "https://github.com/artemyarulin/Kaare.git", :tag => "0.0.1" }
  s.source_files  = "iOS/Kaare/Kaare.{h,m}"
  s.resource_bundles = { 'KaareJS' => ['js/Kaare.js'] }
  s.public_header_files = "iOS/Kaare/Kaare.h"
  s.framework     = "JavaScriptCore"
  s.requires_arc  = true

  s.dependency "ReactiveCocoa", "~> 2.3.1"
  s.dependency "JSCoreBom", "~> 1.0"
end
