/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2010-2016 Igor Zinken / igorski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
"use strict";

const EventHandler = require( "./utils/EventHandler" );
const OOP          = require( "./utils/OOP" );

module.exports = zCanvas;

/**
 * creates an API for an HTMLCanvasElement where all drawables are treated as
 * self-contained Objects that can add/remove themselves from the DisplayList, rather
 * than having a single function aggregating all drawing instructions
 *
 * @constructor
 *
 * @param {number|{
 *            width: number,
 *            height: number,
 *            animate: boolean,
 *            fps: number,
 *            onUpdate: Function,
 *            debug: boolean
 *        }} width when numerical (legacy 4 argument constructor), the desired width of the zCanvas,
 *        when Object it should contain required properties width and height, with others optional
 *        (see defaults for animate and framerate below)
 *        "onUpdate" callback method to execute when the canvas is about to render. This can be used to synchronize
 *            a game's model from a single spot (instead of having each zSprite's update()-method fire)
 *        "debug" specifies whether or not all sprites should render their Bounding Box for debugging purposes
 *
 *        When object, no further arguments will be processed by this constructor
 *
 * @param {number=} height desired height of the zCanvas
 * @param {boolean=} animate specifies whether we will animate the Canvas (redraw it constantly on each
 *            animationFrame), this defaults to false to preserve resources (and will only (re)draw when
 *            adding/removing zSprites from the display list) set this to true when creating animated
 *            content / games
 * @param {number=} framerate  (defaults to 60), only useful when animate is true
 */
function zCanvas( width, height, animate, framerate ) {

    /* assertions */

    let opts;

    if ( typeof width === "number" ) {

        // legacy API

        opts = {
            width: width,
            height: height,
            animate: animate,
            fps: framerate
        };
    }
    else if ( typeof width === "object" ) {

        // new API : Object based

        opts = width;
    }
    else {
        opts = {};
    }

    width  = ( typeof opts.width  === "number" ) ? opts.width  : 300;
    height = ( typeof opts.height === "number" ) ? opts.height : 300;

    if ( width <= 0 || height <= 0 )
        throw new Error( "cannot construct a zCanvas without valid dimensions" );

    /* instance properties */

    /** @public @type {boolean} */     this.DEBUG = ( typeof opts.debug === "boolean" ) ? opts.debug : false;
    /** @protected @type {number} */   this._fps = ( typeof opts.fps === "number" ) ? opts.fps : 60;
    /** @protected @type {number} */   this._renderInterval = 1000 / this._fps;
    /** @protected @type {boolean} */  this._animate = ( typeof opts.animate === "boolean" ) ? opts.animate : false;
    /** @protected @type {boolean} */  this._smoothing = true;
    /** @protected @type {Function} */ this._updateHandler = ( typeof opts.onUpdate === "function" ) ? opts.onUpdate : null;
    /** @protected type {Function} */  this._renderHandler  = this.render.bind( this );
    /** @protected @type {number} */   this._lastRender = 0;
    /** @protected @type {number} */   this._renderId   = 0;
    /** @protected @type {boolean} */  this._renderPending = false;
    /** @protected @type {boolean} */  this._disposed = false;

    /** @protected @type {Array.<zSprite>} */ this._children = [];

    /* initialization */

    /**
     * @protected
     * @type {HTMLCanvasElement}
     */
    this._element = /** @type {HTMLCanvasElement} */ ( document.createElement( "canvas" ));

    /**
     * @protected
     * @type {CanvasRenderingContext2D}
     */
    this._canvasContext = this._element.getContext( "2d" );

    // ensure all is crisp clear on HDPI screens

    const devicePixelRatio  = window.devicePixelRatio || 1;
    const backingStoreRatio = this._canvasContext.webkitBackingStorePixelRatio ||
                              this._canvasContext.mozBackingStorePixelRatio ||
                              this._canvasContext.msBackingStorePixelRatio ||
                              this._canvasContext.oBackingStorePixelRatio ||
                              this._canvasContext.backingStorePixelRatio || 1;

    const ratio = devicePixelRatio / backingStoreRatio;

    /** @protected @type {number} */ this._HDPIscaleRatio = ( devicePixelRatio !== backingStoreRatio ) ? ratio : 1;

    this.setDimensions( width, height );
    this.preventEventBubbling( false );
    this.addListeners();

    if ( this._animate ) {
        this.render();  // start render loop
    }
}

/**
 * extend a given Function reference with the zCanvas prototype, you
 * can use this to create custom zCanvas extensions. From the extensions
 * you can call:
 *
 * InheritingPrototype.super( extensionInstance, methodName, var_args...)
 *
 * to call zCanvas prototype functions from overriding function declarations
 * if you want to call the constructor, methodName is "constructor"
 *
 * @public
 * @param {!Function} extendingFunction reference to
 *        function which should inherit the zCanvas prototype
 */
zCanvas.extend = function( extendingFunction ) {
    OOP.extend( extendingFunction, zCanvas );
};

/* public methods */

/**
 * appends this zCanvas to the DOM (i.e. adds the references <canvas>-
 * element into the supplied container
 *
 * @public
 * @param {Element} aContainer DOM node to append the zCanvas to
 */
zCanvas.prototype.insertInPage = function( aContainer ) {

    if ( this._element.parentNode )
        throw new Error( "zCanvas already present in DOM" );

    aContainer.appendChild( this._element );
};

/**
 * get the <canvas>-element inside the DOM that is used
 * to render this zCanvas' contents
 *
 * @override
 * @public
 *
 * @return {Element}
 */
zCanvas.prototype.getElement = function() {

    return this._element;
};

/**
 * whether or not all events captured by the zCanvas can
 * bubble down in the document, when true, DOM events that
 * have interacted with the zCanvas will stop their propagation
 * and prevent their default behaviour
 *
 * @public
 * @param {boolean} value
 */
zCanvas.prototype.preventEventBubbling = function( value ) {

    /**
     * @protected
     * @type {boolean}
     */
    this._preventDefaults = value;
};

/**
 * @public
 * @param {zSprite} aChild
 *
 * @return {zCanvas} this zCanvas - for chaining purposes
 */
zCanvas.prototype.addChild = function( aChild ) {

    // create a linked list
    const numChildren = this._children.length;

    if ( numChildren > 0 ) {
        aChild.last      = this._children[ numChildren - 1 ];
        aChild.last.next = aChild;
    }
    aChild.next = null;
    aChild.setCanvas( this );
    aChild.setParent( this );

    this._children.push( aChild );
    this.invalidate();

    return this;
};

/**
 * @public
 * @param {zSprite} aChild the child to remove from this zCanvas
 *
 * @return {zSprite} the removed child - for chaining purposes
 */
zCanvas.prototype.removeChild = function( aChild ) {

    aChild.setParent( null );
    aChild.setCanvas( null );

    //aChild.dispose(); // no, we might like to re-use the child at a later stage!

    const childIndex = this._children.indexOf( aChild );
    if ( childIndex !== -1 ) {
        this._children.splice( childIndex, 1 );
    }

    // update linked list

    const prevChild = aChild.last;
    const nextChild = aChild.next;

    if ( prevChild )
        prevChild.next = nextChild;

    if ( nextChild )
        nextChild.last = prevChild;

    aChild.last = aChild.next = null;

    // request a render now the state of the canvas has changed

    this.invalidate();

    return aChild;
};

/**
 * retrieve a child of this zCanvas by its index in the Display List
 *
 * @public
 *
 * @param {number} index of the object in the Display List
 * @return {zSprite} the referenced object
 */
zCanvas.prototype.getChildAt = function( index ) {

    return this._children[ index ];
};

/**
 * remove a child from this zCanvas' Display List at the given index
 *
 * @public
 * @param {number} index of the object to remove
 * @return {zSprite} the removed zSprite
 */
zCanvas.prototype.removeChildAt = function( index ) {

    return this.removeChild( this.getChildAt( index ));
};

/**
 * @public
 * @return {number} the amount of children in this object's Display List
 */
zCanvas.prototype.numChildren = function() {

    return this._children.length;
};

/**
 * @public
 * @return {Array.<zSprite>}
 */
zCanvas.prototype.getChildren = function() {

    return this._children;
};

/**
 * check whether a given display object is present in this object's display list
 *
 * @public
 * @param {zSprite} aChild
 *
 * @return {boolean}
 */
zCanvas.prototype.contains = function( aChild ) {

    return this._children.indexOf( aChild ) > -1;
};

/**
 * invoke when the state of the zCanvas has changed (i.e.
 * the visual contents should change), this will invoke
 * a new render request
 *
 * render requests are only executed when the UI is ready
 * to render (on animationFrame), as such this method can be invoked
 * repeatedly between render cycles without actually triggering
 * multiple render executions (a single one will suffice)
 *
 * @public
 */
zCanvas.prototype.invalidate = function() {

    if ( !this._animate && !this._renderPending ) {
        this._renderPending = true;
        this._renderId = window.requestAnimationFrame( this._renderHandler );
    }
};

/**
 * retrieve all children of this zCanvas that are currently residing at
 * a given coordinate and rectangle, can be used in conjunction with zSprite
 * "collidesWith"-method to query only the objects that are in its vicinity, greatly
 * freeing up CPU resources by not checking against out of bounds objects
 *
 * @public
 *
 * @param {number} aX x-coordinate
 * @param {number} aY y-coordinate
 * @param {number} aWidth rectangle width
 * @param {number} aHeight rectangle height
 * @param {boolean=} aOnlyCollidables optionally only return children that are collidable defaults to false
 *
 * @return {Array.<zSprite>}
 */
zCanvas.prototype.getChildrenUnderPoint = function( aX, aY, aWidth, aHeight, aOnlyCollidables ) {

    const out = [];
    let i = this._children.length, theChild, childX, childY, childWidth, childHeight;

    while ( i-- ) {

        theChild = this._children[ i ];

        childX      = theChild.getX();
        childY      = theChild.getY();
        childWidth  = theChild.getWidth();
        childHeight = theChild.getHeight();

        if ( childX < aX + aWidth  && childX + childWidth  > aX &&
             childY < aY + aHeight && childY + childHeight > aY )
        {
            if ( !aOnlyCollidables || ( aOnlyCollidables && theChild.collidable ))
                out.push( theChild );
        }
    }
    return out;
};

/**
 * return the framerate of the zCanvas, can be queried by
 * child zSprites to calculate strictly timed animated operations
 *
 * @public
 * @return {number}
 */
zCanvas.prototype.getFrameRate = function() {

    return this._fps;
};

/**
 * retrieve the render interval for this zCanvas, this basically
 * describes the elapsed time in milliseconds between each successive
 * render at the current framerate
 *
 * @public
 * @return {number}
 */
zCanvas.prototype.getRenderInterval = function() {

    return this._renderInterval;
};

/**
 * toggle the smoothing of the Canvas' contents.
 * for pixel art-type graphics, setting the smoothing to
 * false will yield crisper results
 *
 * @public
 * @param {boolean} aValue
 */
zCanvas.prototype.setSmoothing = function( aValue ) {

    const props = [ "imageSmoothingEnabled",  "mozImageSmoothingEnabled",
                  "oImageSmoothingEnabled", "webkitImageSmoothingEnabled" ];

    const ctx = this._canvasContext;

    this._smoothing = aValue;

    // observed not to work during setup

    window.requestAnimationFrame(() => {

        props.forEach(( prop ) => {
            if ( ctx[ prop ] !== undefined )
                ctx[ prop ] = aValue;
        });
    });
};

/**
 * @public
 * @return {number}
 */
zCanvas.prototype.getWidth = function() {

    return this._width;
};

/**
 * @public
 * @return {number}
 */
zCanvas.prototype.getHeight = function() {

    return this._height;
};

/**
 * updates the dimensions of the zCanvas
 *
 * @public
 *
 * @param {number} aWidth
 * @param {number} aHeight
 */
zCanvas.prototype.setDimensions = function( aWidth, aHeight ) {

    // apply scale factor for HDPI screens
    const scaleFactor = this._HDPIscaleRatio;

    /** @protected @type {number} */ this._width  = aWidth;
    /** @protected @type {number} */ this._height = aHeight;

    this._element.width  = aWidth  * scaleFactor;
    this._element.height = aHeight * scaleFactor;

    this._element.style.width  = aWidth  + "px";
    this._element.style.height = aHeight + "px";

    this._canvasContext.scale( scaleFactor, scaleFactor );

    // non-smoothing must be re-applied when the canvas dimensions change...

    if ( this._smoothing === false )
        this.setSmoothing( this._smoothing );

    this.invalidate();
};

/**
 * set the background color for the zCanvas, either hexadecimal
 * or RGB/RGBA, e.g. "#FF0000" or "rgba(255,0,0,1)";
 *
 * @public
 * @param {string} aColor
 */
zCanvas.prototype.setBackgroundColor = function( aColor ) {

    /**
     * @protected
     * @type {string}
     */
    this._bgColor = aColor;
};

/**
 * @public
 * @param {boolean} value
 */
zCanvas.prototype.setAnimatable = function( value ) {

    const oldValue = this._animate;
    this._animate  = value;

    if ( value && !oldValue )
        this._renderHandler();
};

/**
 * @public
 * @return {boolean}
 */
zCanvas.prototype.isAnimatable = function() {
    return this._animate;
};

/**
 * high precision pixel-based collision detection, can be queried to check whether the given
 * zSprite collides with another drawable object. By supplying specific RGBA values it is
 * possible to check for collision with a specific object as long as its colour is unique
 * (for instance a fully black "wall" (R = 0, G = 0, B = 0) or a purple "bullet"
 * (R = 255, G = 0, B = 128), etc. Note this method requires more from the CPU than
 * simply checking overlapping bounding boxes (see zSprite "collidesWith"-method).
 *
 * NOTE : invoke this in "update"-method of a zSprite as this requires existing pixel data
 * being onscreen !
 *
 * @public
 *
 * @param {zSprite} aSprite to check collisions for
 * @param {number|null=} aRedValue optional value between 0 - 255 the red channel must hold
 * @param {number|null=} aGreenValue optional value between 0 - 255 the green channel must hold
 * @param {number|null=} aBlueValue optional value between 0 - 255 the blue channel must hold
 * @param {number|null=} aAlphaValue optional value between 0 - 255 the alpha channel must hold
 * @param {number=} aX optional x-coordinate of the collision, defaults to current x of given sprite
 * @param {number=} aY optional y-coordinate of the collision, defaults to current y of given sprite
 * @param {number=} aWidth optional width of the collision rectangle, will default
 *                  to one pixel (will check one pixel to the left of given sprite and
 *                  one pixel on the right side of given sprite)
 * @param {number=} aHeight optional height of the collision rectangle, will default
 *                  to one pixel (will check one pixel above given sprite and one
 *                  pixel below given sprite)
 *
 * @return {number} 0 = no collision, 1 = horizontal collision, 2 = vertical collision, 3 = horizontal and vertical collisions
 */
zCanvas.prototype.checkCollision = function( aSprite, aRedValue, aGreenValue, aBlueValue, aAlphaValue,
                                             aX, aY, aWidth, aHeight ) {

    aX = aX || aSprite.getX();
    aY = aY || aSprite.getY();

    aWidth  = aWidth  || 1;
    aHeight = aHeight || 1;

    const spriteWidth  = aSprite.getWidth();
    const spriteHeight = aSprite.getHeight();
    const ctx          = this._canvasContext;

    // the inner collision check

    const internalCheck = ( aX, aY, aWidth, aHeight ) => {

        const bitmap = ctx.getImageData( aX, aY, aWidth, aHeight );
        let match;

        // Here we loop through the bitmap slice and its colors
        // (maximum four, each representing a channel in the RGBA spectrum)

        for ( let i = 0, l = ( aWidth * aHeight ) * 4; i < l; i += 4 ) {

            match = false;

            // check red value (if specified)

            if ( typeof aRedValue === "number" ) {
                match = ( bitmap.data[ i ] === aRedValue );
                if ( !match ) return false;
            }

            // check green value (if specified)

            if ( typeof aGreenValue === "number" ) {
                match = ( bitmap.data[ i + 1 ] === aGreenValue );
                if ( !match ) return false;
            }

            // check blue value (if specified)

            if ( typeof aBlueValue === "number" ) {
                match = ( bitmap.data[ i + 2 ] === aBlueValue );
                if ( !match ) return false;
            }

            // check alpha value (if specified)

            if ( typeof aAlphaValue === "number" ) {
                match = ( bitmap.data[ i + 3 ] === aAlphaValue );
                if ( !match ) return false;
            }

            if ( match )
                return true;
        }
        return false;
    };

    let horizontalCollision, verticalCollision;

    // check 1 : to the left
    horizontalCollision = internalCheck( aX - aWidth, aY, aWidth, spriteHeight );

    // check 2 : below
    verticalCollision = internalCheck( aX, aY + spriteHeight + aHeight, spriteWidth, aHeight );

    // check 3: to the right
    if ( !horizontalCollision )
        horizontalCollision = internalCheck( aX + spriteWidth + aWidth, aY, aWidth, spriteHeight );

    // check 4 : above
    if ( !verticalCollision )
        verticalCollision = internalCheck( aX, aY - aHeight, spriteWidth, aHeight );

    if ( !horizontalCollision && !verticalCollision )
        return 0;

    if ( horizontalCollision ) {

        if ( verticalCollision )
            return 3;

        return 1;
    }
    return 2;
};

/**
 * @public
 */
zCanvas.prototype.dispose = function() {

    if ( this._disposed )
        return;

    this._disposed = true;
    this.removeListeners();
    this._animate = false;
    window.cancelAnimationFrame( this._renderId ); // kill render loop

    // dispose all sprites on Display List

    let i = this.numChildren();

    while ( i-- ) {
        this._children[ i ].dispose();
    }
    this._children = [];
};

/* event handlers */

/**
 * @protected
 * @param {Event} aEvent
 */
zCanvas.prototype.handleInteraction = function( aEvent ) {

    const numChildren  = this._children.length;
    let eventOffsetX = 0, eventOffsetY = 0;
    let theChild, touches, found;

    if ( numChildren > 0 ) {

        // reverse loop to first handle top layers
        theChild = this._children[ numChildren - 1 ];

        switch ( aEvent.type ) {

            // all touch events
            default:

                touches /** @type {TouchList} */ = ( aEvent.touches.length > 0 ) ? aEvent.touches : aEvent.changedTouches;

                if ( touches.length > 0 ) {

                    const offset = this.getCoordinate();

                    eventOffsetX = touches[ 0 ].pageX - offset.x;
                    eventOffsetY = touches[ 0 ].pageY - offset.y;
                }

                while ( theChild ) {
                    theChild.handleInteraction( eventOffsetX, eventOffsetY, aEvent );
                    theChild = theChild.last; // note we don't break this loop for multi touch purposes
                }
                break;

            // all mouse events
            case "mousedown":
            case "mousemove":
            case "mouseup":

                while ( theChild ) {

                    found = theChild.handleInteraction( aEvent.offsetX, aEvent.offsetY, aEvent );

                    if ( found )
                        break;

                    theChild = theChild.last;
                }
                break;
        }
    }

    if ( this._preventDefaults ) {

        aEvent.stopPropagation();
        aEvent.preventDefault();
    }

    // update the Canvas contents
    this.invalidate();
};

/* protected methods */

/**
 * the render loop drawing the Objects onto the Canvas, shouldn't be
 * invoked directly but by the animation loop or an update request
 *
 * @protected
 */
zCanvas.prototype.render = function() {

    const now   = Date.now();  // current timestamp
    const delta = now - this._lastRender;

    this._renderPending = false;

    // only execute render when the time for a single frame
    // (at the requested framerate) has passed

    if ( delta > this._renderInterval ) {

        this._lastRender = now - ( delta % this._renderInterval );

        const ctx = this._canvasContext;
        let theSprite;

        if ( ctx ) {

            // clear previous canvas contents either by flooding it
            // with the optional background colour, or by clearing all pixel content

            if ( this._bgColor ) {
                ctx.fillStyle = this._bgColor;
                ctx.fillRect( 0, 0, this._width, this._height );
            }
            else {
                ctx.clearRect( 0, 0, this._width, this._height );
            }

            const useExternalUpdateHandler = ( typeof this._updateHandler === "function" );

            if ( useExternalUpdateHandler ) {
                this._updateHandler( now );
            }

            // draw the children onto the canvas

            if ( this._children.length > 0 ) {

                theSprite = this._children[ 0 ];

                while ( theSprite ) {

                    if ( !useExternalUpdateHandler ) {
                        theSprite.update( now );
                    }
                    theSprite.draw( ctx );
                    theSprite = theSprite.next;
                }
            }
        }
    }

    // keep render loop going if zCanvas is animatable

    if ( !this._disposed && this._animate ) {
        this._renderPending = true;
        this._renderId = window.requestAnimationFrame( this._renderHandler );
    }
};

/**
 * zSprites have no HTML elements, the actual HTML listeners are
 * added onto the canvas, the zCanvas will delegate events onto
 * the "children" of the canvas' Display List
 *
 * @protected
 */
zCanvas.prototype.addListeners = function() {

    if ( !this._eventHandler ) {

        /**
         * @protected
         * @type {EventHandler}
         */
        this._eventHandler = new EventHandler();
    }

    const theListener = this.handleInteraction.bind( this );

    // use touch events ?

    if ( !!( "ontouchstart" in window ))
    {
        this._eventHandler.addEventListener( this._element, "touchstart", theListener );
        this._eventHandler.addEventListener( this._element, "touchmove",  theListener );
        this._eventHandler.addEventListener( this._element, "touchend",   theListener );
    }
    else {
        // nope, use mouse events
        this._eventHandler.addEventListener( this._element, "mousedown", theListener );
        this._eventHandler.addEventListener( this._element, "mousemove", theListener );
        this._eventHandler.addEventListener( window,        "mouseup",   theListener );   // yes, window!
    }
};

/**
 * zSprites have no HTML elements, the actual HTML listeners are
 * added onto the canvas, the zCanvas will delegate events onto
 * the "children" of the canvas' Display List
 *
 * @protected
 */
zCanvas.prototype.removeListeners = function() {

    if ( this._eventHandler ) {
        this._eventHandler.dispose();
    }
    this._eventHandler = null;
};

/**
 * get the position of this sprite's HTML element and
 * return its x and y coordinates
 *
 * @protected
 * @return {Object} w/ x and y properties
 */
zCanvas.prototype.getCoordinate = function() {

    let left = 0;
    let top  = 0;
    let theElement = this._element;

    while ( theElement.offsetParent ) {

        left      += theElement.offsetLeft;
        top       += theElement.offsetTop;
        theElement = theElement.offsetParent;
    }
    left += theElement.offsetLeft;
    top  += theElement.offsetTop;

    return { "x" : left, "y" : top };
};
