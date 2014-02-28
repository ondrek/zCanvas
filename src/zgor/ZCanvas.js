/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2010-2014 Igor Zinken / igorski
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
var zgor = zgor || {};

/**
 * creates an API for a HTML Canvas similar to the Flash Stage Object
 * its "children" are zCanvass which can be "added" and "removed"
 * from a DisplayList. Each child is drawn onto the canvas on each render cycle
 *
 * @constructor
 * @extends {util.Disposable}
 * 
 * @param {number}   aWidth desired canvas width
 * @param {number}   aHeight desired canvas height
 * @param {boolean=} aAnimateable whether we will animate the Canvas, defaults to false
 *                   to preserve resources (will only (re)draw when adding/removing from display list)
 * @param {number=}  aFrameRate desired framerate, defaults to 60 fps
 */
zgor.ZCanvas = function( aWidth, aHeight, aAnimateable, aFrameRate )
{
    this._renderInterval = 1000 / ( aFrameRate || 60 );

    // no need to keep redefining the scope application of these callbacks! cache them!
    this._renderHandler  = util.bind( function()
    {
        this._renderId = window[ "requestAnimationFrame" ]( util.bind( this.render, this ));

    }, this );

    this._renderTimeoutCallback = util.bind( this.render, this );

    this._children = [];
    this._animate = aAnimateable || false;

    this._element       = /** @type {HTMLCanvasElement} */ ( document.createElement( "canvas" ));
    this._canvasContext = this._element[ "getContext" ]( "2d" );
    this.setDimensions( aWidth, aHeight );

    this.addListeners();

    if ( this._animate ) {
        this.render();  // starts render loop
    }
};

// inherit from parent disposable
zgor.ZCanvas.prototype = new util.Disposable();

/* class variables */

/** @private @type {HTMLCanvasElement} */ zgor.ZCanvas.prototype._element;
/** @private @type {number} */            zgor.ZCanvas.prototype._width;
/** @private @type {number} */            zgor.ZCanvas.prototype._height;

/** @private @type {CanvasRenderingContext2D} */ zgor.ZCanvas.prototype._canvasContext;
/** @private @type {util.EventHandler} */        zgor.ZCanvas.prototype._eventHandler;
/** @private @type {Array.<zgor.ZSprite>} */     zgor.ZCanvas.prototype._children;

/** @private @type {boolean} */   zgor.ZCanvas.prototype._disposed = false;
/** @private @type {boolean} */   zgor.ZCanvas.prototype._animate = false;
/** @private @type {number} */    zgor.ZCanvas.prototype._renderInterval;
/** @private @type {!Function} */ zgor.ZCanvas.prototype._renderHandler;
/** @private @type {number} */    zgor.ZCanvas.prototype._renderId;
/** @private @type {!Function} */ zgor.ZCanvas.prototype._renderTimeoutCallback;

/* public methods */

/**
 * @public
 * @param {zgor.ZSprite} aChild
 * @return {zgor.ZCanvas} this object - for chaining purposes
 */
zgor.ZCanvas.prototype.addChild = function( aChild )
{
    // create a linked list
    var numChildren = this._children.length;

    if ( numChildren > 0 )
    {
        aChild.last      = this._children[ numChildren - 1 ];
        aChild.last.next = aChild;
        aChild.next      = null;
    }
    aChild.setParent( this, true );
    aChild.stage = this;

    this._children.push( aChild );

    if ( !this._animate )
    {
        this.render(); // re-draw Canvas contents if we're not animating
    }
    return this;
};

/**
 * @public
 * @param {zgor.ZSprite} aChild  the child to remove from this zCanvas
 */
zgor.ZCanvas.prototype.removeChild = function( aChild )
{
    aChild.dispose();

    var i = this._children.length;

    while ( i-- )
    {
        if ( this._children[ i ] == aChild )
        {
            this._children.splice( i, 1 );
            break;
        }
    }
    aChild.setParent( null );
    aChild.stage = null;

    // update linked list
    var l = this._children.length;
    for ( i = 0; i < l; ++i )
    {
        var theSprite = this._children[ i ];

        if ( i > 0 )
        {
            var prevSprite  = this._children[ i - 1 ];
            theSprite.last  = prevSprite;
            prevSprite.next = theSprite;
        }
        else {
            theSprite.last = null;
        }

        if ( i == ( l - 1 ))
            theSprite.next = null;
    }
    if ( !this._animate )
    {
        this.render(); // re-draw Canvas contents if we're not animating
    }
};

/**
 * @override
 * @public
 * @returns {Element}
 */
zgor.ZCanvas.prototype.getElement = function()
{
    return this._element;
};

/**
 * @override
 * @public
 * @param {lib.display.IDisplayObject} aParent
 */
zgor.ZCanvas.prototype.setParent = function( aParent )
{
    // just for interface implementation purposes
};

/**
 * @override
 * @public
 */
zgor.ZCanvas.prototype.onAddedToStage = function()
{
    // just for interface implementation purposes
};

/**
 * @override
 * @public
 */
zgor.ZCanvas.prototype.onRemovedFromStage = function()
{
    // just for interface implementation purposes
};

/**
 * get a child of this zCanvas by its index in the Display List
 *
 * @public
 * @param {number} index of the object in the Display List
 * @return {zgor.ZSprite} the referenced object
 */
zgor.ZCanvas.prototype.getChildAt = function( index )
{
    return this._children[ index ];
};

/**
 * remove a child from this object's Display List at the given index
 *
 * @public
 * @param {number} index of the object to remove
 */
zgor.ZCanvas.prototype.removeChildAt = function( index )
{
    this.removeChild( this.getChildAt( index ));
};

/**
 * @public
 * @return {number} the amount of children in this object's Display List
 */
zgor.ZCanvas.prototype.numChildren = function()
{
    return this._children.length;
};

/**
 * check whether a given display object is present in this object's display list
 *
 * @public
 * @param {lib.display.IDisplayObject} aChild
 * @return {boolean}
 */
zgor.ZCanvas.prototype.contains = function( aChild )
{
    var i = this._children.length;

    while( i-- )
    {
        if ( this._children[ i ] == aChild )
        {
            return true;
        }
    }
    return false;
};

/**
 * @public
 * @return {number}
 */
zgor.ZCanvas.prototype.getWidth = function()
{
    return this._width;
};

/**
 * @public
 * @return {number}
 */
zgor.ZCanvas.prototype.getHeight = function()
{
    return this._height;
};

/**
 * @public
 * @return {boolean}
 */
zgor.ZCanvas.prototype.isAnimateable = function()
{
    return this._animate;
};

/**
 * forces an update of the Canvas' contents, will be omitted
 * when this is an animated Stage as the next render cycle
 * will auto-update the Canvas
 *
 * @public
 * @param {boolean=} aDelayed optional 0 ms delay which makes
 *                   sure the update occurs on the next render cycle
 *                   use when performing large memory operations
 */
zgor.ZCanvas.prototype.update = function( aDelayed )
{
    if ( !this._animate )
    {
        if ( aDelayed )
        {
            lib.utils.time.FrameDelay.wait( this._renderTimeoutCallback );
        }
        else {
            this.render();
        }
    }
};

/**
 * update the dimensions of the zCanvas
 *
 * @public
 * @param {number} aWidth
 * @param {number} aHeight
 */
zgor.ZCanvas.prototype.setDimensions = function( aWidth, aHeight )
{
    this._element[ "width" ]  = this._width  = aWidth;
    this._element[ "height" ] = this._height = aHeight;

    this.update( true );
};

/* protected methods */

/**
 * @override
 * @protected
 */
zgor.ZCanvas.prototype.disposeInternal = function()
{
    this.removeListeners();

    window[ "cancelAnimationFrame" ]( this._renderId ); // kill render loop

    // dispose all sprites on Display List
    
    var i = this.numChildren();

    while ( i-- )
    {
        this._children[ i ].dispose();
    }
    this._children = [];
};

/* event handlers */

/**
 * @private
 * @param {Event} aEvent
 */
zgor.ZCanvas.prototype.handleInteraction = function( aEvent )
{
    var numChildren  = this._children.length;
    var eventOffsetX = 0;
    var eventOffsetY = 0;

    if ( numChildren > 0 )
    {
        var theChild = this._children[ 0 ];

        switch ( aEvent.type )
        {
            // all touch events
            default:

                var touches /** @type {TouchList} */  = aEvent.touches;

                if ( touches.length > 0 )
                {
                    var offset = this.getCoordinate();

                    eventOffsetX = touches[ 0 ].pageX - offset.x;
                    eventOffsetY = touches[ 0 ].pageY - offset.y;
                }

                while ( theChild )
                {
                    theChild.handleInteraction( eventOffsetX, eventOffsetY, aEvent );
                    theChild = theChild.next; // note we don't break this loop for multi touch purposes
                }
                break;

            // all mouse events
            case "mousedown":
            case "mousemove":
            case "mouseup":

                while ( theChild )
                {
                    var found = theChild.handleInteraction( aEvent.offsetX, aEvent.offsetY, aEvent );

                    if ( found )
                        break;

                    theChild = theChild.next;
                }
                break;
        }
    }
    aEvent.stopPropagation();
    aEvent.preventDefault();

    // update the Canvas contents
    if ( !this._animate )
    {
        this.render();
    }
};

/* private methods */

/**
 * the render loop drawing the Objects onto the Canvas
 *
 * @private
 */
zgor.ZCanvas.prototype.render = function()
{
    // keep render cycle going at the requested framerate

    if ( !this._disposed && this._animate )
    {
        setTimeout( this._renderHandler, this._renderInterval );
    }
    var ctx = this._canvasContext;

    // clear previous canvas contents

    ctx.fillStyle = 'rgb(245,245,245)';
    ctx.fillRect( 0, 0, this._width, this._height );

    // draw the children onto the canvas
    if ( this._children.length > 0 )
    {
        var theSprite = this._children[ 0 ];

        while ( theSprite )
        {
            theSprite.update();
            theSprite.draw( ctx );

            theSprite = theSprite.next;
        }
    }
};

/**
 * zSprites have no HTML elements, the actual HTML listeners are
 * added onto the canvas, the zCanvas will delegate events onto
 * the "children" of the canvas' Display List
 *
 * @private
 */
zgor.ZCanvas.prototype.addListeners = function()
{
    var theHandler  = this.getHandler();
    var theListener = util.bind( this.handleInteraction, this );

    // use touch events ?

    if ( !!( "ontouchstart" in window ))
    {
        theHandler.addEventListener( this._element, "touchstart", theListener );
        theHandler.addEventListener( this._element, "touchmove",  theListener );
        theHandler.addEventListener( this._element, "touchend",   theListener );
    }
    else {
        // nope, use mouse events
        theHandler.addEventListener( this._element, "mousedown", theListener );
        theHandler.addEventListener( this._element, "mousemove", theListener );
        theHandler.addEventListener( window,        "mouseup",   theListener );   // yes, window!
    }
};

/**
 * zSprites have no HTML elements, the actual HTML listeners are
 * added onto the canvas, the zCanvas will delegate events onto
 * the "children" of the canvas' Display List
 *
 * @private
 */
zgor.ZCanvas.prototype.removeListeners = function()
{
    if ( this._eventHandler )
    {
        this._eventHandler.dispose();
    }
};

/**
 * @private
 * @returns {util.EventHandler}
 */
zgor.ZCanvas.prototype.getHandler = function()
{
    return ( this._eventHandler ) ? this._eventHandler  : ( this._eventHandler = new util.EventHandler());
};

/**
 * @private
 * get the position of this sprite's HTML element and
 * return its x and y coordinates
 *
 * @return {Object} w/ x and y properties
 */
zgor.ZCanvas.prototype.getCoordinate = function()
{
    var left = 0;
    var top  = 0;

    var theElement = this._element;

    while ( theElement.offsetParent )
    {
        left      += theElement.offsetLeft;
        top       += theElement.offsetTop;
        theElement = theElement.offsetParent;
    }
    left += theElement.offsetLeft;
    top  += theElement.offsetTop;

    return { "x" : left, "y" : top };
};