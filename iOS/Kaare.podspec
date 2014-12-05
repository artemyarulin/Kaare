Pod::Spec.new do |s|
  s.name          = "Kaare"
  s.version       = "1.0.0"
  s.summary       = "Cross platform reactive communication channel between JavaScript and native code"
  s.description   = "Kaare allows communication between native code and JavaScript inside JavaScriptCore, UIWebView or even static HTML page"
  s.homepage      = "https://github.com/artemyarulin/Kaare"
  s.license       = { :type => 'MIT', :file => 'LICENSE' }
  s.author        = { "Artem Yarulin" => "artem.yarulin@fessguid.com" }
  s.platform      = :ios, "7.0"
  s.source        = { :git => "https://github.com/artemyarulin/Kaare.git", :tag => "1.0.0" }
  s.source_files  = "Kaare/iOS/Kaare.{h,m,js}"
  s.public_header_files = "Kaare/iOS/Kaare.h"
  s.framework  = "JavaScriptCore"
  s.requires_arc  = true
end
