zCanvas
=======

JavaScript library for interacting with HTML Canvas drawables as if they were separate animatable, interactive Objects.
zCanvas is optimized for mobile devices, relying on optimal use of resources and works well with touch events, as such
zCanvas can be an excellent resource for creating (mobile) web games.

The concept of zCanvas encourages Object Oriented Programming, where each custom drawable Object you create for your
project should inherit its prototype from the zSprite-"class". You'll find you'll only have to override two methods
for custom drawable logic and its visual rendering.

zCanvas has been written in vanilla JavaScript and thus works independent from (and should work with) any other
JavaScript framework.

DisplayList convention
======================

Where the HTMLCanvasElement differs from other HTML elements in that its contents aren't visible as individual nodes (but rather, as pixels), zCanvas
provides an API that allows you to interact with drawable Objects as separate entities (called zSprites), attaching logic to individual
elements leaving you, as developer, without the hassle of managing the relation of the drawn elements to the <canvas> element and DOM.

zCanvas follows the concept of the DisplayList (familiar to those knowledgeable in ActionScript 3) where drawable Objects
become visible on screen once they have been added to a container. zSprites can also be stacked within other zSprites.
If you're familiar with addChild and removeChild, you're good to go.

Optimized for performance
=========================

zCanvas has been extensively optimized for the best performance and works a treat on mobile devices too. The amount of
event listeners attached to DOM elements are limited to the <canvas> only, where the internal interactions are delegated
to the zSprites by the zCanvas.

Easily animatable
=================

As all rendering logic resides in a single method of your zSprite, you can easily attach tweening libraries such as
the excellent TweenMax by Greensock to alter the visible properties of your zSprite for maximum eye candy.

Google Closure
==============

zCanvas has been annotated extensively with JSDocs, allowing the source to minimized with maximum compression when using the
Closure compiler by Google. If you're also partial to using the Closure Library by Google, you can replace the rudimentary
Disposable / EventHandler / bind described in the utils/Helpers.js-file with the respective goog-counterparts.
