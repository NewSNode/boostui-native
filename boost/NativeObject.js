define(function (require, exports, module) {
    "use strict";

    var derive = require("base/derive");
    var slice = require("base/slice");
    var EventTarget = require("boost/EventTarget");
    var tagMap = require("boost/tagMap");
    var queue = require("boost/bridge");

    var NativeObject = derive(EventTarget, function (tag) {
        var origObj;

        this._super();
        if (tag === undefined) {
            tag = tagMap.genTag();
        }

        origObj = tagMap.get(tag);
        if (origObj !== null && origObj instanceof NativeObject) {
            origObj.destroy();
        }

        tagMap.set(tag, this);
        this.__tag__ = tag;
    }, {
        "get tag": function () {
            return this.__tag__;
        },

        __callNative: function (method, args) {
            queue.call(this.__tag__, method, args);
        },

        __onEvent: function (type, event) {
            //do nothing
        },

        destroy: function () {
            nativeGlobal.destroyObject(this.__tag__);
        }
    });

    NativeObject.bindNative = function (method) {
        return function () {
            this.__callNative(method, slice(arguments));
        };
    };

    var GLOBAL_TAG = null;
    var NativeGlobalObject = derive(NativeObject, function () {
        this._super(GLOBAL_TAG);
    }, {
        createView: NativeObject.bindNative("createView"),
        updateView: NativeObject.bindNative("updateView"),
        addView: NativeObject.bindNative("addView"),
        removeView: NativeObject.bindNative("removeView"),
        removeAllViews: NativeObject.bindNative("removeAllViews"),
        //for TEST
        flush: NativeObject.bindNative("flush"),

        createAnimation: NativeObject.bindNative("createAnimation"),
        __destroy: NativeObject.bindNative("destroy"),
        destroyObject: function (tag) {
            this.__destroy(tag);
        }
    });

    var nativeGlobal = new NativeGlobalObject();
    NativeObject.global = nativeGlobal;

    NativeObject.getByTag = function (tag) {
        var obj = tagMap.get(tag);
        if (obj !== null && obj instanceof NativeObject) {
            return obj;
        }
        return null;
    };


    document.addEventListener("boost", function (e) {
        var origin = e.origin;
        var target = NativeObject.getByTag(origin);
        var type = e.boostEventType.toLowerCase();
        if (target) {
            // 这里为了提高效率，就不用 dispatchEvent 那一套了。
            target.__onEvent(type, e);
        }
        /*
        var event;
        if (target) {
            switch (type) {
            case "touchstart":
            case "touchend":
                event = new TouchEvent(type, target, e.x, e.y);
                target.dispatchEvent(event);
                break;
            default:
                console.log(e);
                return;
            }

        }
       */
    }, false);

    module.exports = NativeObject;

});
