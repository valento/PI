'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mysql = require('mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var config = require('../../config');

var options = {
  user: config.get('MYSQL_USER'),
  password: config.get('MYSQL_PASSWORD'),
  database: config.get('MYSQL_DB'),
  host: 'localhost'
};

if (config.get('INSTANCE_CONNECTION_NAME') && config.get('NODE_ENV') === 'production') {
  options.socketPath = '/cloudsql/' + config.get('INSTANCE_CONNECTION_NAME');
  //options.host = '172.17.0.6'
  options.port = 3306;
}

var db = _mysql2.default.createPool(options);
db.on('connection', function (connection) {
  return console.log('DB connected');
});

exports.default = {
  getOne: function getOne() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var table = arguments[1];
    var scope = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ['*'];

    var sql = void 0;
    var sc = scope.map(function (entry) {
      return 'u.' + entry;
    });
    var _key = Object.keys(data);
    var _value = Object.values(data);
    if (table === 'user') {
      sql = 'SELECT ' + sc + ',\n      ul.id,ul.name,ul.door,ul.floor,ul.bell,ul.ref,ul.admin,ul.mobile,ul.location,ul.c_status,ul.prime\n      FROM user u\n      LEFT OUTER JOIN user_location ul ON u.uid=ul.uid\n      WHERE u.email=\'' + data.email + '\'\n      ';
    } else {
      sql = 'SELECT ' + scope + ' FROM ' + table + ' WHERE ' + _key + '=\'' + _value + '\'';
    }
    console.log(sql);
    return new Promise(function (resolve, reject) {
      db.query(sql, function (err, results) {
        if (table === 'user') {
          console.log('User Init data: ', results);
        }
        if (!err) {
          resolve(results);
        } else {
          reject(err);
        }
      });
    });
  },

  // GET Location by REP = location.uid
  getOneReference: function getOneReference() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var table = arguments[1];
    var scope = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ['*'];

    var sql = void 0,
        l = void 0;
    if (isNaN(data.uid)) {
      l = 'l.uid';
    } else {
      l = 'l.id';
    }
    sql = 'SELECT l.number,l.id,s.name\n    FROM location l INNER JOIN street s\n    WHERE ' + l + '=\'' + data.uid + '\'\n    AND s.id=l.street_id';
    console.log(sql);
    return new Promise(function (resolve, reject) {
      db.query(sql, function (err, results) {
        if (!err) {
          console.log(results);
          resolve(results);
        } else {
          reject(err);
        }
      });
    });
  },

  getList: function getList(table) {
    var scope = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ['*'];
    var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    var PARAMS = '',
        sql = void 0;
    var _key = params ? Object.keys(params) : null;
    if (_key && _key.length > 0) {
      var kk = _key.map(function (k) {
        return table === 'orders' ? k + '=' + params[k] : k + '=' + params[k];
      });
      PARAMS = _key.length > 1 ? kk.join(' AND ') : kk[0];
      if (table === 'product') {
        PARAMS = PARAMS.concat(' ORDER BY list');
      }
    }
    //else if(_key) {
    //  PARAMS = `${_key[0]}=${params._key[0]}`
    //}
    if (table === 'orders') {
      sql = 'SELECT\n      o.id,o.uid,o.promo_id as order_promo,o.ordered_at,o.pick_up_time,o.delivery,o.user_location,\n      od.item,od.quant,od.delay,od.promo_id,od.options\n      FROM orders o\n      JOIN order_detail od ON od.order_id=o.id\n      WHERE ' + PARAMS;
    } else {
      sql = !params ? 'SELECT {' + scope + '} FROM ' + table : 'SELECT ' + scope + ' FROM ' + table + ' WHERE ' + PARAMS;
    }
    console.log(sql);
    return new Promise(function (resolve, reject) {
      db.query(sql, function (err, results) {
        console.log(results);
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  saveMany: function saveMany() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var table = arguments[1];

    var _keys = Object.keys(data[0]);
    var params = data.map(function (i) {
      var v = Object.values(i);
      return v;
    });
    var sql = 'INSERT INTO ' + table + ' (' + _keys + ') VALUES ?';
    console.log(sql, [params]);
    return new Promise(function (resolve, reject) {
      db.query(sql, [params], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  },
  saveOne: function saveOne() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var table = arguments[1];

    var _keys = Object.keys(data),
        _values = [];
    var params = Object.values(data).map(function (v) {
      _values.push('?');
      return v;
    });
    var sql = 'INSERT INTO ' + table + ' (' + _keys + ') VALUES (' + _values + ')';
    console.log(sql, params);
    return new Promise(function (resolve, reject) {
      db.query(sql, params, function (err, result) {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  },
  saveOneLocation: function saveOneLocation() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var table = arguments[1];

    var jsn = '',
        sql = '';
    var bg = data.bg,
        lat = data.lat,
        uid = data.uid,
        street_id = data.street_id,
        city = data.city,
        number = data.number;


    switch (table) {
      case 'city':
        jsn = '\'{"bg": "' + bg + '", "en": "' + lat + '", "es": "' + lat + '"}\'';
        sql = 'INSERT INTO ' + table + ' (name,code) VALUES (' + jsn + ',' + data.code + ')';
        break;
      case 'street':
        jsn = '\'{"bg": "' + bg + '", "en": "' + lat + '", "es": "' + lat + '"}\'';
        sql = 'INSERT INTO ' + table + ' (name,city) VALUES (' + jsn + ',' + data.city + ')';
        break;
      case 'location':
        console.log(data);
        sql = 'INSERT INTO ' + table + ' (uid,city,street_id,number)\n        VALUES (\'' + uid + '\',' + city + ',' + street_id + ',' + number + ')';
        break;
    }

    console.log(sql, data);
    return new Promise(function (resolve, reject) {
      db.query(sql, function (err) {
        if (err) return reject();
        resolve();
      });
    });
  },
  updateOne: function updateOne() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var table = arguments[1];

    var id = data.id,
        rest = _objectWithoutProperties(data, ['id']);

    var _map = Object.keys(rest).map(function (entry) {
      if (entry === 'name' || entry === 'bell' || entry === 'entry') {
        return entry + '=\'' + rest[entry] + '\'';
      } else {
        return entry + '=' + rest[entry];
      }
    });
    var sql = table === 'user' ? 'UPDATE ' + table + ' SET ' + _map + ' WHERE uid=' + id : 'UPDATE ' + table + ' SET ' + _map + ' WHERE id=' + id;
    console.log('Update ORM: ', sql);
    return new Promise(function (resolve, reject) {
      db.query(sql, function (err) {
        if (err) return reject();
        resolve();
      });
    });
  },
  updateMany: function updateMany() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var table = arguments[1];

    var sql = 'UPDATE ' + table + ' SET status=2 WHERE id IN (' + data.id + ')';
    console.log('Update many: ', data.id);
    return new Promise(function (resolve, reject) {
      db.query(sql, function (err) {
        if (err) return reject();
        resolve();
      });
    });
  }
};
//# sourceMappingURL=index.js.map