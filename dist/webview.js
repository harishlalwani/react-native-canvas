function _construct(Parent, args, Class) { if (typeof Reflect !== "undefined" && Reflect.construct) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Parent.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if ((typeof Symbol === "function" ? Symbol.iterator : "@@iterator") in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var WEBVIEW_TARGET = '@@WEBVIEW_TARGET';

var ID = function ID() {
  return Math.random().toString(32).slice(2);
};

var flattenObject = function flattenObject(object) {
  if (typeof object !== 'object') {
    return object;
  }

  var flatObject = {};

  for (var key in object) {
    flatObject[key] = object[key];
  }

  for (var _key in Object.getOwnPropertyNames(object)) {
    flatObject[_key] = object[_key];
  }

  return flatObject;
};

var AutoScaledCanvas = function () {
  function AutoScaledCanvas(element) {
    _classCallCheck(this, AutoScaledCanvas);

    this.element = element;
  }

  _createClass(AutoScaledCanvas, [{
    key: "toDataURL",
    value: function toDataURL() {
      var _this$element;

      return (_this$element = this.element).toDataURL.apply(_this$element, arguments);
    }
  }, {
    key: "autoScale",
    value: function autoScale() {
      if (this.savedHeight !== undefined) this.element.height = this.savedHeight;
      if (this.savedWidth !== undefined) this.element.width = this.savedWidth;
      window.autoScaleCanvas(this.element);
    }
  }, {
    key: "width",
    get: function get() {
      return this.element.width;
    },
    set: function set(value) {
      this.savedWidth = value;
      this.autoScale();
      return value;
    }
  }, {
    key: "height",
    get: function get() {
      return this.element.height;
    },
    set: function set(value) {
      this.savedHeight = value;
      this.autoScale();
      return value;
    }
  }]);

  return AutoScaledCanvas;
}();

var toMessage = function toMessage(result) {
  if (result instanceof Blob) {
    return {
      type: 'blob',
      payload: btoa(result),
      meta: {}
    };
  }

  if (result instanceof Object) {
    if (!result[WEBVIEW_TARGET]) {
      var id = ID();
      result[WEBVIEW_TARGET] = id;
      targets[id] = result;
    }

    return {
      type: 'json',
      payload: flattenObject(result),
      meta: {
        target: result[WEBVIEW_TARGET],
        constructor: result.__constructorName__ || result.constructor.name
      }
    };
  }

  return {
    type: 'json',
    payload: JSON.stringify(result),
    meta: {}
  };
};

var canvas = document.createElement('canvas');
var autoScaledCanvas = new AutoScaledCanvas(canvas);
var targets = {
  canvas: autoScaledCanvas,
  context2D: canvas.getContext('2d')
};
var constructors = {
  Image: Image,
  Path2D: Path2D,
  CanvasGradient: CanvasGradient
};

Image.bind = Image.bind || function () {
  return Image;
};

Path2D.bind = Path2D.bind || function () {
  return Path2D;
};

var populateRefs = function populateRefs(arg) {
  if (arg && arg.__ref__) {
    return targets[arg.__ref__];
  }

  return arg;
};

document.body.appendChild(canvas);

function handleMessage(_ref) {
  var id = _ref.id,
      type = _ref.type,
      payload = _ref.payload;

  switch (type) {
    case 'exec':
      {
        var _targets$target;

        var target = payload.target,
            method = payload.method,
            args = payload.args;

        var result = (_targets$target = targets[target])[method].apply(_targets$target, _toConsumableArray(args.map(populateRefs)));

        var message = toMessage(result);

        if (typeof result === 'object' && !message.meta.constructor) {
          for (var constructorName in constructors) {
            if (result instanceof constructors[constructorName]) {
              message.meta.constructor = constructorName;
            }
          }
        }

        postMessage(JSON.stringify(_objectSpread({
          id: id
        }, message)));
        break;
      }

    case 'set':
      {
        var _target = payload.target,
            key = payload.key,
            value = payload.value;
        targets[_target][key] = populateRefs(value);
        break;
      }

    case 'construct':
      {
        var _constructor = payload.constructor,
            _target2 = payload.id,
            _payload$args = payload.args,
            _args = _payload$args === void 0 ? [] : _payload$args;

        var object = _construct(constructors[_constructor], _toConsumableArray(_args));

        object.__constructorName__ = _constructor;

        var _message = toMessage({});

        targets[_target2] = object;
        postMessage(JSON.stringify(_objectSpread({
          id: id
        }, _message)));
        break;
      }

    case 'listen':
      {
        var _ret = function () {
          var types = payload.types,
              target = payload.target;

          for (var _iterator = types, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[typeof Symbol === "function" ? Symbol.iterator : "@@iterator"]();;) {
            var _ref2;

            if (_isArray) {
              if (_i >= _iterator.length) break;
              _ref2 = _iterator[_i++];
            } else {
              _i = _iterator.next();
              if (_i.done) break;
              _ref2 = _i.value;
            }

            var _eventType = _ref2;
            targets[target].addEventListener(_eventType, function (e) {
              var message = toMessage({
                type: 'event',
                payload: {
                  type: e.type,
                  target: _objectSpread({}, flattenObject(targets[target]), _defineProperty({}, WEBVIEW_TARGET, target))
                }
              });
              postMessage(JSON.stringify(_objectSpread({
                id: id
              }, message)));
            });
          }

          return "break";
        }();

        if (_ret === "break") break;
      }
  }
}

var handleError = function handleError(err, message) {
  postMessage(JSON.stringify({
    id: message.id,
    type: 'error',
    payload: {
      message: err.message
    }
  }));
  document.removeEventListener('message', handleIncomingMessage);
};

function handleIncomingMessage(e) {
  var data = JSON.parse(e.data);

  if (Array.isArray(data)) {
    for (var _iterator2 = data, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[typeof Symbol === "function" ? Symbol.iterator : "@@iterator"]();;) {
      var _ref3;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref3 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref3 = _i2.value;
      }

      var _message2 = _ref3;

      try {
        handleMessage(_message2);
      } catch (err) {
        handleError(err, _message2);
      }
    }
  } else {
    try {
      handleMessage(data);
    } catch (err) {
      handleError(err, data);
    }
  }
}

document.addEventListener('message', handleIncomingMessage);