'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _generatePassword = require('generate-password');

var _generatePassword2 = _interopRequireDefault(_generatePassword);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _user = require('../api/user');

var _user2 = _interopRequireDefault(_user);

var _mailer = require('../mailer');

var _middleware = require('../middleware/');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var authRouter = _express2.default.Router({
  mergeParams: true
});

authRouter.use(_bodyParser2.default.json());

authRouter.post('/', function (req, res, next) {
  var new_user = true,
      user = void 0,
      token = void 0,
      confirmToken = void 0,
      pass = void 0;
  var email = req.body.credentials.email;

  var jwtOptions = { expiresIn: '240d' };
  var scope = ['username', 'userlast', 'uid', 'verified', 'orders', 'credit', 'gender', 'bday', 'membership', 'language', 'status'];
  _user2.default.checkOne(email, scope).then(function (results) {
    // --- Login -> User exist but No token: ---
    if (results.length > 0) {
      var uid = results[0].uid;

      token = _jsonwebtoken2.default.sign({ email: email, uid: uid }, process.env.JWT_SECRET, jwtOptions);
      //user = Object.assign({},{token: token, new_user: false},results[0])

      try {
        _user2.default.getOne({ email: email }, 'user', scope).then(function (results) {
          if (results.length === 0) return res.status(401).json({ error: { message: 'User Not Found' } });

          //let user = {}

          var _results$ = results[0],
              uid = _results$.uid,
              username = _results$.username,
              userlast = _results$.userlast,
              verified = _results$.verified,
              orders = _results$.orders,
              credit = _results$.credit,
              gender = _results$.gender,
              bday = _results$.bday,
              membership = _results$.membership,
              language = _results$.language,
              status = _results$.status,
              rest = _objectWithoutProperties(_results$, ['uid', 'username', 'userlast', 'verified', 'orders', 'credit', 'gender', 'bday', 'membership', 'language', 'status']);

          user = Object.assign({}, { token: token, new_user: false }, {
            uid: uid, username: username, userlast: userlast, verified: verified, orders: orders, credit: credit,
            gender: gender, bday: bday, membership: membership, language: language, status: status
          });

          if (results.length > 1) {
            user.locations = [];
            results.forEach(function (ent) {
              var mobile = ent.mobile,
                  name = ent.name,
                  location = ent.location,
                  city = ent.city,
                  admin = ent.admin,
                  door = ent.door,
                  floor = ent.floor,
                  bell = ent.bell,
                  id = ent.id,
                  entry = ent.entry,
                  prime = ent.prime,
                  c_status = ent.c_status;

              if (c_status === 4) {
                user.locations.push({ mobile: mobile, name: name, location: location, city: city, admin: admin, door: door, floor: floor, bell: bell, id: id, entry: entry, prime: prime });
              }
            });
          } else {
            if (rest.id !== null) {
              user.locations = [];
              user.locations.push(rest);
            }
          }
          res.status(200).json({ user: user });
        });
      } catch (err) {
        res.status(500).json({ error: { message: err } });
      }
    }
    // --- SignUp -> New User: ---
    else {
        // Generate Pass and Confirmation Token:
        confirmToken = _jsonwebtoken2.default.sign({ email: email }, process.env.JWT_SECRET, jwtOptions);
        pass = _generatePassword2.default.generate({
          length: 8,
          numbers: true
        });
        // encrypt password and save it to DB:
        _bcrypt2.default.hash(pass, 8, function (err, hash) {
          if (!err) {
            try {
              _user2.default.signup({ email: email, password: hash, token: confirmToken }).then(function (id) {
                // Send mail to User with confirmToken:
                (0, _mailer.sendConfirmMail)(email, confirmToken);
                console.log('authRouter:', id);
                // Generate Token for localStorage:
                token = _jsonwebtoken2.default.sign({ email: email, uid: id }, process.env.JWT_SECRET, jwtOptions);
                user = Object.assign({}, { token: token, new_user: true });
                res.status(200).json({ user: user });
              });
            } catch (err) {
              res.status(500).json(err);
            }
          }
        });
      }
  }).catch(function (err) {
    return res.status(500).json(err);
  });
});

// Check if User UID Exist and STATUS:4:
authRouter.get('/check', _middleware.getUser, function (req, res, next) {
  var uid = req.uid,
      email = req.email;

  _user2.default.checkOne(email).then(function (results) {
    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(401).json({ error: { message: 'No such User' } });
    }
  });
});

authRouter.get('/confirmation/:token', function (req, res, next) {
  var token = req.params.token;

  var decoded = _jsonwebtoken2.default.decode(token);
  if (!decoded || decoded === null) {
    console.log('Invalid verification token...');
    req.errr = { message: 'Invalid verification token...'
      //next()
    };res.redirect('/');
  } else {
    _user2.default.verify(decoded.email, ['email']).then(function (rows) {
      if (rows === 0) {
        req.errr = { message: 'No such user' };
      }
      //next()
      res.redirect('/');
    }).catch(function (err) {
      return { message: 'Something went wrong' };
    });
  }
});

exports.default = authRouter;
//# sourceMappingURL=auth.js.map