'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var JWT = require('jsonwebtoken');

module.exports = function (app) {
  var vToken = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(value, secret) {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt('return', new _promise2.default(function (resolve) {
                // 返回对像，不抛错误
                JWT.verify(value, secret, function (err, decoded) {
                  if (err) {
                    app.think.logger.error(err.name + ' - ' + err.message);
                  }
                  resolve(err || decoded);
                });
              }));

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function vToken(_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }();

  var getValue = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(name, opts) {
      var config, tokenValue, key, checkField, secret, decoded, uuid, tmpCacheKey, tmpValue, checkValue, cacheKey, value;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              config = getConf(opts);
              tokenValue = getToken.call(this, opts);

              if (tokenValue) {
                _context2.next = 4;
                break;
              }

              return _context2.abrupt('return', null);

            case 4:
              key = config.key;
              checkField = config.checkField;
              secret = config.secret;
              _context2.next = 9;
              return vToken(tokenValue, secret);

            case 9:
              decoded = _context2.sent;
              uuid = decoded.uuid;

              if (uuid) {
                _context2.next = 13;
                break;
              }

              return _context2.abrupt('return', null);

            case 13:
              tmpCacheKey = config.cachePrefix + '-' + uuid + '-' + name;
              _context2.next = 16;
              return app.think.cache(tmpCacheKey);

            case 16:
              tmpValue = _context2.sent;

              if (!(typeof tmpValue === 'undefined')) {
                _context2.next = 19;
                break;
              }

              return _context2.abrupt('return', null);

            case 19:

              // 校验的值 通常是用户密码 存在则需要校验 用于用户修改密码，让其他 Token 失效
              checkValue = tmpValue[checkField];
              // 不需要校验

              if (tmpValue[key] && checkValue) {
                _context2.next = 22;
                break;
              }

              return _context2.abrupt('return', tmpValue);

            case 22:
              cacheKey = config.cachePrefix + '-' + name + '-' + tmpValue[key];
              _context2.next = 25;
              return app.think.cache(cacheKey);

            case 25:
              value = _context2.sent;

              if (!(typeof value === 'undefined')) {
                _context2.next = 28;
                break;
              }

              return _context2.abrupt('return', null);

            case 28:
              if (!(checkValue !== value[checkField])) {
                _context2.next = 30;
                break;
              }

              return _context2.abrupt('return', null);

            case 30:
              return _context2.abrupt('return', value);

            case 31:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function getValue(_x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  }();

  var setValue = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(name, value, opts) {
      var config, key, secret, cachePrefix, checkField, uuid, time, tokenValue, decoded, tokenObj, tmpCacheKey, tmpObj, cacheKey;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              config = getConf(opts);
              key = config.key;
              secret = config.secret;
              cachePrefix = config.cachePrefix;
              checkField = config.checkField;
              uuid = '';
              time = '';
              tokenValue = getToken.call(this, opts);

              if (!tokenValue) {
                _context3.next = 14;
                break;
              }

              _context3.next = 11;
              return vToken(tokenValue, secret);

            case 11:
              decoded = _context3.sent;

              uuid = decoded.uuid;
              time = decoded.time;

            case 14:
              if (uuid) {
                _context3.next = 21;
                break;
              }

              if (!(value === null)) {
                _context3.next = 17;
                break;
              }

              return _context3.abrupt('return', '');

            case 17:
              tokenObj = setToken.call(this, opts);

              uuid = tokenObj.uuid;
              tokenValue = tokenObj.sign;
              time = tokenObj.time;

            case 21:
              tmpCacheKey = cachePrefix + '-' + uuid + '-' + name;

              // 需要二次缓存 做校验

              if (value && value[key] && value[checkField]) {
                tmpObj = {};

                tmpObj[key] = value[key];
                tmpObj[checkField] = value[checkField];
                app.think.cache(tmpCacheKey, tmpObj);
                cacheKey = cachePrefix + '-' + name + '-' + value[key];

                app.think.cache(cacheKey, value);
              } else {
                app.think.cache(tmpCacheKey, value);
              }

              return _context3.abrupt('return', { token: tokenValue, uuid: uuid, time: time });

            case 24:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    return function setValue(_x5, _x6, _x7) {
      return _ref3.apply(this, arguments);
    };
  }();

  var token = function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(name, value) {
      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (think.isString(name)) {
                _context4.next = 3;
                break;
              }

              app.think.loader.error('参数name必须为字符串');
              return _context4.abrupt('return', null);

            case 3:
              if (value || value === 0 || value === null || value === '') {
                _context4.next = 5;
                break;
              }

              return _context4.abrupt('return', getValue.call(this, name, opts));

            case 5:
              return _context4.abrupt('return', setValue.call(this, name, value, opts));

            case 6:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    return function token(_x8, _x9) {
      return _ref4.apply(this, arguments);
    };
  }();

  var clearToken = function () {
    var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(name, id) {
      var config, cachePrefix, cacheKey;
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              config = getConf(opts);
              cachePrefix = config.cachePrefix;
              cacheKey = cachePrefix + '-' + name + '-' + id;
              return _context5.abrupt('return', this.cache(cacheKey, null));

            case 4:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    return function clearToken(_x11, _x12) {
      return _ref5.apply(this, arguments);
    };
  }();

  function getConf(opts) {
    var dfOpts = {
      name: 'token',
      key: 'id',
      checkField: 'password',
      secret: 'fullBase',
      cachePrefix: 'token-full',
      setCookie: false
    };
    var dfConfig = think.config('token');
    return (0, _assign2.default)(dfOpts, dfConfig, opts);
  }

  function getToken(opts) {
    var config = getConf(opts);
    var tokenName = config.name;
    var isSetCookie = config.setCookie;
    var tokenValue = '';
    if (isSetCookie) {
      tokenValue = this.cookie(tokenName) || this.header(tokenName);
    } else {
      tokenValue = this.header(tokenName) || this.cookie(tokenName);
    }
    if (!tokenValue) {
      app.think.logger.error(tokenName + ' \u7684\u503C\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u8BF7\u5728 header or post or cookie \u4F20\u503C');
      return null;
    }
    return tokenValue;
  }

  function setToken(opts) {
    var config = getConf(opts);
    var secret = config.secret;
    var tokenName = config.name;
    var uuid = app.think.uuid('v1');
    var isSetCookie = config.setCookie;
    var time = new Date().getTime();
    var sign = JWT.sign({ uuid: uuid, time: time }, secret);
    if (isSetCookie) {
      this.setCookie(tokenName, sign);
    } else {
      this.header(tokenName, sign);
    }

    return { sign: sign, uuid: uuid, time: time };
  }

  return {
    context: {
      token: token,
      clearToken: clearToken
    },
    controller: {
      token: token,
      clearToken: clearToken
    },
    service: {
      token: token,
      clearToken: clearToken
    }
  };
};
