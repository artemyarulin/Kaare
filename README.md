# Kaare
Cross platform reactive communication channel between JavaScript and native code

Wouldn't it be cool to build UI using ReactiveCocoa and use JavaScript as a cross platform business logic core which will utilize RxJS to solve callback hell? 

Kaare makes it even more awesome by making communication between native and JS code reactive as well.

# Transports
Kaare support following communication schemes:

Scheme							| Desc
---						 		| ---
JavaScriptCore <> Native 		| Using JavaScriptCore bindings
UIWebView <> Native 	 		| Using [WebViewJavaScriptBridge](https://github.com/marcuswestin/WebViewJavascriptBridge) 
HTML page (useful for testing)  | HTTP transport is used based on [webdis](https://github.com/nicolasff/webdis)      		 