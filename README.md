# Kaare
HTTP server inside you mobile app that expose core mobile OS API and your own services. Simplifies writing **hybrid** cross platform applications

## One more mobile cross platform framework?!
Not exactly. This about it as a mobile user: 
- You **do like** native UI with with instant response on your touch
- You **do like** your OS guidlines and you don't want to see iOS tabs on your Android tablet

Non of today frameworks can solve these two issues - Cordova with HTML is too slow, Xamarin and Titanium quite close to solve it, but when you have complex UI, a lot of data - all these wrappers are just a pain. Moreover cross platform UI would bleed from `if (os.platform == 'iOS')`. At least for now I see no other way, but create native UI with bare hands, separatly for each platform using OS guidlines.

But what can we share? Your application brains and heart - business logic. You can use JavaScript, C#, Ruby, whatever you like - at the end it doesn't metter much (*chooose JS*). OK, now we have three applications with separate UI layers and one library with business logic, how can we connect those? And what about platform access, UI layer gave me a cat picture and I want to save it in file?

## HTTP 
HTTP is for sure supported almost everywhere, on almost every platform, let's use this. Let's go through the concept using one example application: It should be able to take a picture and be able to save it using current datetime as a name.

UI layer is implemented using native controls, so nothing to discuss there, but how we communicate with our business logic? Via HTTP request. 

Our UI would request url like `POST http://localhost/services/picture` and send binary data as a request body. Then Kaare would forward this call to appropriate handler in your business logic: It could be native implementation still, it could be JavaScriptCore and some JS has to be evaluated there - the thing is that it is not concert of UI layer. 

But the task is not done yet - for example we are inside WebView, we have JavaScript function there, it is called now with binary array as parameter, how can we save it on a disk? Creating file name is not a problem, but what is next, how to save a file? Via HTTP request. 

Our BL would request url like `POST http://localhost/platform/io/2014.11.19` and send binary data as a request body. Finally the task is done: solution is complex, performance is horrible, everybody is unhappy, what the point?

The main point here that we have three different layers that know nothing about how others get implemented, which  allow you to reuse your BL layer completly, without changes on all of the platforms: UI layers are just clients for your services, while your BL layer is using platform services.

I made such a bad example on purpose - so you would understand what is the worst case scenario. What is a average? Imaging contact book:
- UI requests `GET http://localhost/services/contacts?account=John&max=20`
- BL would return JSON (Protocol Buffers, etc.)
- UI would render items based on response
- User triggered delete of an account - `DEELTE http://localhost/services/contacts/13`
- BL would delete an item
- UI updated

Performance hit would be barely visible in this scenario, while you can easily add new UI layers for other platforms. You can rewrite business logic using different language, you can start migrating your Cordova app to Titanium, or maybe start using Xamarin as a UI layer, it doesn't metter - you are free to decide what framework to use, and what parts to use from the fremework.


