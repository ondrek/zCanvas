define("utils/EventHandler",["module"],function(t){"use strict";function e(){this._eventMappings=[],this._disposed=!1}t.exports=e,e.prototype.addEventListener=function(t,e,i){if(!this.hasEventListener(t,e)){if(t.addEventListener)t.addEventListener(e,i,!1);else{if(!t.attachEvent)return!1;t.attachEvent("on"+e,i)}return this._eventMappings.push({element:t,type:e,listener:i}),!0}return!1},e.prototype.hasEventListener=function(t,e){for(var i=this._eventMappings.length;i--;){var n=this._eventMappings[i];if(n.element===t&&n.type==e)return!0}return!1},e.prototype.removeEventListener=function(t,e){for(var i=this._eventMappings.length;i--;){var n=this._eventMappings[i];if(n.element===t&&n.type===e){if(t.removeEventListener)t.removeEventListener(e,n.listener,!1);else{if(!t.detachEvent)return!1;t.detachEvent("on"+e,n.listener)}return this._eventMappings.splice(i,1),!0}}return!1},e.prototype.dispose=function(){if(!this._disposed){this._disposed=!0;for(var t=this._eventMappings.length;t--;){var e=this._eventMappings[t];this.removeEventListener(e.element,e.type)}this._eventMappings=null}}}),define("utils/OOP",["module"],function(t){"use strict";var e=t.exports={extend:function(t,i){function n(){}n.prototype=i.prototype,t.superClass_=i.prototype,t.prototype=new n,t.prototype.constructor=t,t.super=function(t,e,n){for(var o=new Array(arguments.length-2),s=2;s<arguments.length;s++)o[s-2]=arguments[s];return i.prototype[e].apply(t,o)},t.extend=function(i){e.extend(i,t)}}}}),define("Canvas",["module","utils/EventHandler","utils/OOP"],function(t,e,i){"use strict";function n(t,e,i,n){var s=void 0;if(s="number"==typeof t?{width:t,height:e,animate:i,fps:n}:"object"===("undefined"==typeof t?"undefined":o(t))?t:{},t="number"==typeof s.width?s.width:300,e="number"==typeof s.height?s.height:300,t<=0||e<=0)throw new Error("cannot construct a zCanvas without valid dimensions");this.DEBUG="boolean"==typeof s.debug&&s.debug,this._fps="number"==typeof s.fps?s.fps:60,this._renderInterval=1e3/this._fps,this._animate="boolean"==typeof s.animate&&s.animate,this._smoothing=!0,this._updateHandler="function"==typeof s.onUpdate?s.onUpdate:null,this._renderHandler=this.render.bind(this),this._lastRender=0,this._renderId=0,this._renderPending=!1,this._disposed=!1,this._children=[],this._element=document.createElement("canvas"),this._canvasContext=this._element.getContext("2d");var r=window.devicePixelRatio||1,h=this._canvasContext.webkitBackingStorePixelRatio||this._canvasContext.mozBackingStorePixelRatio||this._canvasContext.msBackingStorePixelRatio||this._canvasContext.oBackingStorePixelRatio||this._canvasContext.backingStorePixelRatio||1,a=r/h;this._HDPIscaleRatio=r!==h?a:1,this.setDimensions(t,e),"boolean"==typeof s.smoothing&&this.setSmoothing(s.smoothing),this.preventEventBubbling(!1),this.addListeners(),this._animate&&this.render()}var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};t.exports=n,n.extend=function(t){i.extend(t,n)},n.prototype.insertInPage=function(t){if(this._element.parentNode)throw new Error("Canvas already present in DOM");t.appendChild(this._element)},n.prototype.getElement=function(){return this._element},n.prototype.preventEventBubbling=function(t){this._preventDefaults=t},n.prototype.addChild=function(t){var e=this._children.length;return e>0&&(t.last=this._children[e-1],t.last.next=t),t.next=null,t.setCanvas(this),t.setParent(this),this._children.push(t),this.invalidate(),this},n.prototype.removeChild=function(t){t.setParent(null),t.setCanvas(null);var e=this._children.indexOf(t);e!==-1&&this._children.splice(e,1);var i=t.last,n=t.next;return i&&(i.next=n),n&&(n.last=i),t.last=t.next=null,this.invalidate(),t},n.prototype.getChildAt=function(t){return this._children[t]},n.prototype.removeChildAt=function(t){return this.removeChild(this.getChildAt(t))},n.prototype.numChildren=function(){return this._children.length},n.prototype.getChildren=function(){return this._children},n.prototype.contains=function(t){return this._children.indexOf(t)>-1},n.prototype.invalidate=function(){this._animate||this._renderPending||(this._renderPending=!0,this._renderId=window.requestAnimationFrame(this._renderHandler))},n.prototype.getFrameRate=function(){return this._fps},n.prototype.getRenderInterval=function(){return this._renderInterval},n.prototype.setSmoothing=function(t){var e=["imageSmoothingEnabled","mozImageSmoothingEnabled","oImageSmoothingEnabled","webkitImageSmoothingEnabled"],i=this._canvasContext;this._smoothing=t,window.requestAnimationFrame(function(){e.forEach(function(e){void 0!==i[e]&&(i[e]=t)})})},n.prototype.getWidth=function(){return this._width},n.prototype.getHeight=function(){return this._height},n.prototype.setDimensions=function(t,e){var i=this._HDPIscaleRatio;this._width=t,this._height=e,this._element.width=t*i,this._element.height=e*i,this._element.style.width=t+"px",this._element.style.height=e+"px",this._canvasContext.scale(i,i),this._smoothing===!1&&this.setSmoothing(this._smoothing),this.invalidate()},n.prototype.setBackgroundColor=function(t){this._bgColor=t},n.prototype.setAnimatable=function(t){var e=this._animate;this._animate=t,!t||e||this._renderPending||this._renderHandler()},n.prototype.isAnimatable=function(){return this._animate},n.prototype.dispose=function(){if(!this._disposed){this._disposed=!0,this.removeListeners(),this._animate=!1,window.cancelAnimationFrame(this._renderId);for(var t=this.numChildren();t--;)this._children[t].dispose();this._children=[]}},n.prototype.handleInteraction=function(t){var e=this._children.length,i=0,n=0,o=void 0,s=void 0,r=void 0;if(e>0)switch(o=this._children[e-1],t.type){default:if(s=t.touches.length>0?t.touches:t.changedTouches,s.length>0){var h=this.getCoordinate();i=s[0].pageX-h.x,n=s[0].pageY-h.y}for(;o;)o.handleInteraction(i,n,t),o=o.last;break;case"mousedown":case"mousemove":case"mouseup":for(;o&&!(r=o.handleInteraction(t.offsetX,t.offsetY,t));)o=o.last}this._preventDefaults&&(t.stopPropagation(),t.preventDefault()),this.invalidate()},n.prototype.render=function(){var t=Date.now(),e=t-this._lastRender;this._renderPending=!1,this._lastRender=t-e%this._renderInterval;var i=this._canvasContext,n=void 0;if(i){this._bgColor?(i.fillStyle=this._bgColor,i.fillRect(0,0,this._width,this._height)):i.clearRect(0,0,this._width,this._height);var o="function"==typeof this._updateHandler;if(o&&this._updateHandler(t),this._children.length>0)for(n=this._children[0];n;)o||n.update(t),n.draw(i),n=n.next}this._disposed||!this._animate||this._renderPending||(this._renderPending=!0,this._renderId=window.requestAnimationFrame(this._renderHandler))},n.prototype.addListeners=function(){this._eventHandler||(this._eventHandler=new e);var t=this.handleInteraction.bind(this);"ontouchstart"in window?(this._eventHandler.addEventListener(this._element,"touchstart",t),this._eventHandler.addEventListener(this._element,"touchmove",t),this._eventHandler.addEventListener(this._element,"touchend",t)):(this._eventHandler.addEventListener(this._element,"mousedown",t),this._eventHandler.addEventListener(this._element,"mousemove",t),this._eventHandler.addEventListener(window,"mouseup",t))},n.prototype.removeListeners=function(){this._eventHandler&&this._eventHandler.dispose(),this._eventHandler=null},n.prototype.getCoordinate=function(){for(var t=0,e=0,i=this._element;i.offsetParent;)t+=i.offsetLeft,e+=i.offsetTop,i=i.offsetParent;return t+=i.offsetLeft,e+=i.offsetTop,{x:t,y:e}}}),define("Loader",["module","utils/EventHandler"],function(t,e){"use strict";function i(t,e){h(t)||(e.crossOrigin="Anonymous")}function n(t){return!("boolean"==typeof t.complete&&!t.complete)&&!("undefined"!=typeof t.naturalWidth&&0===t.naturalWidth)}function o(t,e,i){function o(){n(t)?e():++r===s?("function"==typeof i&&i(),console.warn("Image could not be resolved. This shouldn't occur.")):window.requestAnimationFrame(o)}var s=60,r=0;o()}function s(t){var e=("string"==typeof t?t:t.src).substr(0,5);return"data:"===e||"blob:"===e}function r(t){return{width:t.width||t.naturalWidth,height:t.height||t.naturalHeight}}function h(t){if("./"===t.substr(0,2)||0===t.indexOf(window.location.protocol+"//"+window.location.host))return!0;var e=t.split("#")[0].split("?")[0];if(e.indexOf(".html")>-1){var i=e.split("/"),n=i.length;e=e.split(i[n-1]).join("")}if(e){var o=e.match(/^http[s]?:/);if(Array.isArray(o)&&o.length>0)return!1}return!0}function a(t){var e={image:t,size:null};return t instanceof window.HTMLImageElement&&(e.size=r(t)),e}t.exports={loadImage:function(t,r,h){if(h instanceof window.Image&&n(h))return void r(a(h));var d=h instanceof window.Image?h:new window.Image,l=s(t),p=new e,u=function(t){p.dispose(),r(a(d),new Error(t.type))},c=function(){p.dispose(),o(d,function(){return r(a(d))})},f=/^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);l&&!f||(l||i(t,d),p.addEventListener(d,"load",c),p.addEventListener(d,"error",u)),d.src=t,l&&r(a(d))}}}),define("Sprite",["module","utils/OOP","Loader"],function(t,e,i){"use strict";function n(t,e,i,s,r,h,a){var d=void 0;if("number"==typeof t)d={x:t,y:e,width:i,height:s,bitmap:r,collidable:h,mask:a};else{if("object"!==("undefined"==typeof t?"undefined":o(t)))throw new Error("Sprite must either be constructed using a definitions Object {} or x, y, width, height, bitmap (optional), collidable (optional), mask (optional)");d=t}if("number"!=typeof d.width||"number"!=typeof d.height)throw new Error("cannot construct a zSprite without valid dimensions");if("number"!=typeof d.x&&(d.x=0),"number"!=typeof d.y&&(d.y=0),this._children=[],this._disposed=!1,this.collidable="boolean"==typeof d.collidable&&d.collidable,this.hover=!1,this._mask="boolean"==typeof d.mask&&d.mask,this._bounds={left:0,top:0,width:d.width,height:d.height},this._parent=null,this.last=null,this.next=null,n.prototype.canvas=null,this._bitmap,this._bitmapReady=!1,this._draggable=!1,this._interactive=!1,this._keepInBounds=!1,this.isDragging=!1,this.setX(d.x),this.setY(d.y),d.bitmap&&this.setBitmap(d.bitmap),Array.isArray(d.sheet)&&d.sheet.length>0){if(!d.bitmap)throw new Error("cannot use a spritesheet without a valid Bitmap");this.setSheet(d.sheet)}}var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};t.exports=n,n.extend=function(t){e.extend(t,n)},n.prototype.getDraggable=function(){return this._draggable},n.prototype.setDraggable=function(t,e){this._draggable=t,this._keepInBounds=e||!1,t&&!this._interactive&&this.setInteractive(!0)},n.prototype.getX=function(){return this._bounds.left},n.prototype.setX=function(t){var e=t-this._bounds.left;if(this._bounds.left=this._constraint?t+this._constraint.left:t,this._children.length>0)for(var i=this._children[0];i;)i.isDragging||i.setX(i._bounds.left+e),i=i.next},n.prototype.getY=function(){return this._bounds.top},n.prototype.setY=function(t){var e=t-this._bounds.top;if(this._bounds.top=this._constraint?t+this._constraint.top:t,this._children.length>0)for(var i=this._children[0];i;)i.isDragging||i.setY(i._bounds.top+e),i=i.next},n.prototype.getWidth=function(){return this._bounds.width},n.prototype.setWidth=function(t){var e=this._bounds.width||0;this._bounds.width=t,0!==e&&(this._bounds.left-=.5*t-.5*e)},n.prototype.getHeight=function(){return this._bounds.height},n.prototype.setHeight=function(t){var e=this._bounds.height||0;this._bounds.height=t,0!==e&&(this._bounds.top-=.5*t-.5*e)},n.prototype.setBounds=function(t,e,i,n){if("number"!=typeof t&&(t=this._bounds.left),"number"!=typeof e&&(e=this._bounds.top),this._constraint)t-=this._constraint.left,e-=this._constraint.top;else if(!this.canvas)throw new Error("cannot update position of a Sprite that has no constraint or is not added to a canvas");"number"==typeof i&&(this._bounds.width=i),"number"==typeof n&&(this._bounds.height=n);var o=this._bounds.width,s=this._bounds.height,r=this._constraint?this._constraint.width:this.canvas.width,h=this._constraint?this._constraint.height:this.canvas.height;if(this._keepInBounds){var a=Math.min(0,-(o-r)),d=Math.min(0,-(s-h)),l=r-o,p=h-s;t=Math.min(l,Math.max(t,a)),e=Math.min(p,Math.max(e,d))}else t>r&&(t+=.5*o),e>h&&(e+=.5*s);this.setX(t),this.setY(e)},n.prototype.getBounds=function(){return this._bounds},n.prototype.getInteractive=function(){return this._interactive},n.prototype.setInteractive=function(t){this._interactive=t},n.prototype.update=function(t){if(this._children.length>0)for(var e=this._children[0];e;)e.update(t),e=e.next;this._animation&&this.updateAnimation()},n.prototype.draw=function(t){if(this.canvas){if(t.save(),this._mask&&(t.globalCompositeOperation="destination-in"),this._bitmapReady){var e=this._bounds,i=this._animation;i?t.drawImage(this._bitmap,.5+i.col*e.width<<0,.5+i.type.row*e.height<<0,.5+e.width<<0,.5+e.height<<0,.5+e.left<<0,.5+e.top<<0,.5+e.width<<0,.5+e.height<<0):t.drawImage(this._bitmap,.5+e.left<<0,.5+e.top<<0,.5+e.width<<0,.5+e.height<<0)}if(this._children.length>0)for(var n=this._children[0];n;)n.draw(t),n=n.next;this._mask&&(t.globalCompositeOperation="source-over"),t.restore(),this.canvas.DEBUG&&this.drawOutline(t)}},n.prototype.collidesWith=function(t){if(t===this)return!1;var e=this._bounds,i=t.getBounds();return!(e.top+e.height<i.top||e.top>i.top+i.height||e.left+e.width<i.left||e.left>i.left+i.width)},n.prototype.getIntersection=function(t){if(this.collidesWith(t)){var e=this._bounds,i=t.getBounds(),n=Math.max(e.left,i.left),o=Math.max(e.top,i.top),s=Math.min(e.left+e.width,i.width+i.height)-n,r=Math.min(e.top+e.height,i.top+i.height)-o;return{left:n,top:o,width:s,height:r}}return null},n.prototype.collidesWithEdge=function(t,e){if(t===this)return!1;if(isNaN(e)||e<0||e>3)throw new Error("invalid argument for edge");switch(e){case 0:return this.getX()<=t.getX()+t.getWidth();case 1:return this.getY()<=t.getY()+t.getHeight();case 2:return this.getX()+this.getWidth()<=t.getX();case 3:return this.getY()+this.getHeight()>=t.getY()}return!1},n.prototype.getBitmap=function(){return this._bitmap},n.prototype.setBitmap=function(t,e,n){var o=this;if(this._bitmap!==t&&(this._bitmapReady=!1),!t)return void(this._bitmap=null);var s="number"==typeof e,r="number"==typeof n;if(s&&this.setWidth(e),r&&this.setHeight(n),this._keepInBounds&&this.canvas&&(s||r)){var h=-(this._bounds.width-this.canvas.getWidth()),a=-(this._bounds.height-this.canvas.getHeight());this._bounds.left>0?this._bounds.left=0:this._bounds.left<h&&(this._bounds.left=h),this._bounds.top>0?this._bounds.top=0:this._bounds.top<a&&(this._bounds.top=a)}if(t instanceof window.HTMLCanvasElement)this._bitmap=t,this._bitmapReady=!0;else{if(!(t instanceof window.HTMLImageElement||"string"==typeof t))throw new Error("expected HTMLImageElement, HTMLCanvasElement or String for Image source, got "+t+" instead");!function(){var e=o;i.loadImage(t,function(t,i){i instanceof Error?console.error(i.message+" occurred. Could not setBitmap()"):(e._bitmap=t.image,e._bitmapReady=!0,o._bitmapWidth=t.size.width,o._bitmapHeight=t.size.height)})}()}},n.prototype.setSheet=function(t){this._sheet=t,this._animation={type:null,col:0,maxCol:0,fpt:0,counter:0},this.switchAnimation(0)},n.prototype.switchAnimation=function(t){var e=this._animation,i=this._sheet[t];e.type=i,e.fpt=i.fpt,e.maxCol=i.col+(i.amount-1),e.col=i.col,e.counter=0,e.onComplete=i.onComplete},n.prototype.setParent=function(t){this._parent=t},n.prototype.getParent=function(){return this._parent},n.prototype.setCanvas=function(t){this.canvas=t},n.prototype.setConstraint=function(t,e,i,n){return this._constraint={left:t,top:e,width:i,height:n},this._bounds.left=Math.max(t,this._bounds.left),this._bounds.top=Math.max(e,this._bounds.top),this._keepInBounds=!0,this._constraint},n.prototype.getConstraint=function(){return this._constraint},n.prototype.addChild=function(t){var e=this._children.length;return e>0&&(t.last=this._children[e-1],t.last.next=t,t.next=null),t.setCanvas(this.canvas),t.setParent(this),this._children.push(t),this.canvas&&this.canvas.invalidate(),this},n.prototype.removeChild=function(t){t.setParent(null),t.setCanvas(null);var e=this._children.indexOf(t);e!==-1&&this._children.splice(e,1);var i=t.last,n=t.next;return i&&(i.next=n),n&&(n.last=i),t.last=t.next=null,this.canvas&&this.canvas.invalidate(),t},n.prototype.getChildAt=function(t){return this._children[t]},n.prototype.removeChildAt=function(t){return this.removeChild(this.getChildAt(t))},n.prototype.numChildren=function(){return this._children.length},n.prototype.contains=function(t){return this._children.indexOf(t)>-1},n.prototype.dispose=function(){if(!this._disposed){this._disposed=!0,this._parent&&this._parent.removeChild(this);for(var t=this._children.length;t--;){var e=this._children[t];e.dispose(),e.next=e.last=null}this._children=[]}},n.prototype.handlePress=function(t,e){},n.prototype.handleRelease=function(t,e){},n.prototype.handleClick=function(){},n.prototype.handleMove=function(t,e){var i=this._dragStartOffset.x+(t-this._dragStartEventCoordinates.x),n=this._dragStartOffset.y+(e-this._dragStartEventCoordinates.y);this.setBounds(i,n)},n.prototype.handleInteraction=function(t,e,i){var n=!1,o=void 0,s=this.getX(),r=this.getY(),h=this._children.length;if(h>0)for(o=this._children[h-1];o;){if(n=o.handleInteraction(t,e,i))return!0;o=o.last}if(!this._interactive)return!1;if(this.isDragging&&("touchend"===i.type||"mouseup"===i.type))return this.isDragging=!1,Date.now()-this._dragStartTime<250&&this.handleClick(),this.handleRelease(t,e),!0;var a=this._bounds;if(t>=s&&t<=s+a.width&&e>=r&&e<=r+a.height){if(this.hover=!0,!this.isDragging&&("touchstart"===i.type||"mousedown"===i.type))return this.isDragging=!0,this._dragStartTime=Date.now(),this._dragStartOffset={x:this._bounds.left,y:this._bounds.top},this._dragStartEventCoordinates={x:t,y:e},this.handlePress(t,e),!0}else this.hover=!1;return!(!this._draggable||!this.isDragging)&&(this.handleMove(t,e),!0)},n.prototype.updateAnimation=function(){var t=this._animation;++t.counter===t.fpt&&(++t.col,t.counter=0),t.col>t.maxCol&&(t.col=t.type.col,"function"==typeof t.onComplete&&t.onComplete(this))},n.prototype.drawOutline=function(t){t.lineWidth=1,t.strokeStyle="#FF0000",t.strokeRect(this.getX(),this.getY(),this.getWidth(),this.getHeight())}}),define("Collision",["module"],function(t){"use strict";var e=document.createElement("canvas"),i=e.getContext("2d"),n=t.exports={pixelCollision:function(t,e,i){var o=t.getIntersection(e);if(null===o)return!1;var s=n.getPixelArray(t,o),r=n.getPixelArray(e,o),h=0;if(i===!0)for(var a=0;a<o.height;++a)for(var d=0;d<o.width;++d){if(0!==s[h]&&0!==r[h])return{x:d,y:a};++h}else for(h;h<s.length;++h)if(0!==s[h]&&0!==r[h])return!0;return!1},getPixelArray:function(t,n){var o=t.getBitmap(),s=t.getBounds(),r=parseInt(n.left-s.left),h=parseInt(n.top-s.top),a=parseInt(n.width),d=parseInt(n.height);0===a&&(a=1),0===d&&(d=1);var l=!(o instanceof window.HTMLCanvasElement),p=l?e:o,u=l?i:o.getContext("2d");l&&(p.width=s.width,p.height=s.height,u.clearRect(0,0,e.width,e.height),u.drawImage(o,0,0,s.width,s.height));for(var c=u.getImageData(r,h,a,d),f=c.data,g=new Array(parseInt(a*d)),_=0,m=0;m<d;++m)for(var v=0;v<a;++v){var y=4*(m*a+v);g[_]=f[y+3]<<24|f[y]<<16|f[y+1]<<8|f[y+2],++_}return g},getChildrenUnderPoint:function(t,e,i,n,o,s){for(var r=[],h=t.length,a=void 0,d=void 0,l=void 0,p=void 0,u=void 0;h--;)a=t[h],d=a.getX(),l=a.getY(),p=a.getWidth(),u=a.getHeight(),d<e+n&&d+p>e&&l<i+o&&l+u>i&&(!s||s&&a.collidable)&&r.push(a);return r}}}),define("zcanvas.amd",["module","Canvas","Sprite","Loader","Collision"],function(t,e,i,n,o){"use strict";t.exports={canvas:e,sprite:i,loader:n,collision:o}});