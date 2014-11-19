# Kaare
HTTP server inside you mobile app that expose core mobile OS API and your own services. Simplifies writing **hybrid** cross platform applications

## Why?
Imagine you have hybrid application where part of UI implemented using native technologies, part using HTML. Business logic implemented using JavaScript and finally you have platform API that you have to use from your BL. Now multiply it on number of platforms that you support. How can you bind it all together while keep it abstract so it could be easily changed when you need it? Using HTTP.

## Your services
Keep in mind how Single Application Page now works in web - your UI is just a client for your business logic which can be accessed using HTTP service. The principle is the same: Whenever UI needs to show something it calls `GET http://localhost/services/action`. The biggest benefit in the web - that you can add new client for your BL, like mobile application, desktop client. Same applies here - when your UI is just a consumer of your HTTP services you can relativly easily implement new UI layer for other platform, change the existing one from the native to Xamarin, Titanium, HTML, etc. or (better one) - use different technologies at the same time depending on a requirments you have right now (static screens - HTML, tables with a lot of custom rendering - native, simple forms like login forms - Xamarin,Titanium, etc.)

## Platform access
There is a set of API that almost every platform provides: HTTP request, IO, Notifications, etc. which could be wrapped and used in the same way on all platforms. Your BL needs to create a notification - `PUT http://localhost/platform/notification/` and it is created. Think about it as a Cordova plugins - it provides you bridge to native API

## Why so complicated, why not take HTML, Xamarin, Titanium, etc. and do everything there?
Nowadays writing cross platform applications is a part of our lives, we cannot avoid it and biggest challange is how to share as much code between platforms as possible. At the same time:
- Users **do like** native interface
- Users **do like** when platform UI guidlines is followed 
- Because of a small screen sizes and lower performance comparing with computer - you as a developer are forced to create new custom controls in order to squize all the information on a screen, you have to make a lot of optimizations in order to provide great user expirience to the user. 

Unfortunately non of the todays wrappers can achive all of these (they can expose all the possible API of each platoform to you - but it wouldn't be a wrapper anymore). So at the end the only way is to create hybrid application where Kaare can help you.

## Documentation
[Kaare API](docs/API.md)