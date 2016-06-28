var express = require('express'),
  router = express.Router(),
  md5 = require('md5'),
  jwt = require('jsonwebtoken'),
  mongoose = require('mongoose'),
  config = require('../bin/config'),
  db = require('../model/db');


function isAuthenticated(req, res, next){
  var token = req.body.token || req.query.token || req.headers.authorization;
  if(token){
    jwt.verify(token, config.secret, function(err, decoded){
      if (err) {
        res.json({success: false, message: 'Failed to authenticate token'});
      }else {
        req.decoded = decoded;
        next();
      }
    });
  }else {
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });
  }
}

router.post('/authenticate', function(req, res, next){
  db.users.findOne({username: req.body.username}).exec(function(err, data){
    if (data) {
      if (data.password !== md5(req.body.password)) {
        return res.json({message: 'password not match', success: false});
      }else {
        var token = jwt.sign(data, config.secret, {
          expiresIn: '60m',
          algorithm: 'HS256'
        });
        return res.json({message: 'logged', succes: true, token: token});
      }
    }else {
      res.json({message: 'This username is not available', success: false});
    }
  });
});

router.get('/charts', isAuthenticated, function(req, res, next) {
  db.pemasukan.aggregate([{
    $project: {
      nominal: 1,
      year: {
        "$year": "$date"
      },
      month: {
        "$month": "$date"
      }
    }
  }, {
    $match: {
      "year": new Date().getFullYear(),
    }
  }, {
    $group: {
      _id: "$month",
      total: {
        $sum: "$nominal"
      },
      items: {
        $sum: 1
      }
    }
  }, {
    $sort: {
      "_id": 1
    }
  }]).exec(function(err, data_pemasukan) {
    if (!err) {
      db.pengeluaran.aggregate([{
        $project: {
          nominal: 1,
          year: {
            "$year": "$date"
          },
          month: {
            "$month": "$date"
          }
        }
      }, {
        $match: {
          "year": new Date().getFullYear(),
        }
      }, {
        $group: {
          _id: "$month",
          total: {
            $sum: "$nominal"
          },
          itens: {
            $sum: 1
          }
        }
      }, {
        $sort: {
          "_id": 1
        }
      }]).exec(function(err, data_pengeluaran) {
        res.json({
          pemasukan: data_pemasukan,
          pengeluaran: data_pengeluaran
        });
      });
    }
  });
});

router.get('/pemasukan', isAuthenticated, function(req, res, next) {
  db.pemasukan.aggregate(
    [{
      $project: {
        name: "$name",
        nominal: "$nominal",
        date: "$date",
        keterangan: "$keterangan"
      }
    }]
  ).sort({
    date: -1
  }).limit(10).exec(function(err, data) {
    if (err) return res.status(401).send();
    res.json(data);
  });
});

router.get('/pengeluaran', isAuthenticated, function(req, res, next) {
  db.pengeluaran.aggregate(
    [{
      $project: {
        name: "$name",
        nominal: "$nominal",
        date: "$date",
        keterangan: "$keterangan"
      }
    }]
  ).sort({
    date: -1
  }).limit(10).exec(function(err, data) {
    if (err) return res.status(401).send();
    res.json(data);
  });
});

router.get('/pemasukan/:paginate', isAuthenticated, function(req, res, next) {
  db.pemasukan.aggregate(
    [{
      $project: {
        name: "$name",
        nominal: "$nominal",
        date: "$date",
        keterangan: "$keterangan"
      }
    }]
  ).sort({
    date: -1
  }).skip(parseInt(req.params.paginate)).limit(10).exec(function(err, data) {
    if (err) return res.status(401).send();
    res.json(data);
  });
});

router.get('/pengeluaran/:paginate', isAuthenticated, function(req, res, next) {
  db.pengeluaran.aggregate(
    [{
      $project: {
        name: "$name",
        nominal: "$nominal",
        date: "$date",
        keterangan: "$keterangan"
      }
    }]
  ).sort({
    date: -1
  }).skip(parseInt(req.params.paginate)).limit(10).exec(function(err, data) {
    if (err) return res.status(401).send();
    res.json(data);
  });
});

router.post('/pemasukan/insert', isAuthenticated, function(req, res, next) {
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('keterangan', 'Desciption is required').notEmpty();
  req.checkBody('nominal', 'Nominal is required').notEmpty();
  req.checkBody('nominal', 'Only numbers').isNumeric();
  var validEorros = req.validationErrors();
  if (validEorros) {
    res.json({
      success: false,
      message: validEorros
    });
  } else {
    var add = new db.pemasukan({
      name: req.body.name,
      keterangan: req.body.keterangan,
      nominal: req.body.nominal
    });
    add.save(function(err) {
      if (err) return res.status(401).send();
      if (!err) res.json({
        succes: true,
        message: 'succes insert pemasukan'
      });
    });
  }

});

router.post('/pengeluaran/insert', isAuthenticated, function(req, res, next) {
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('keterangan', 'Desciption is required').notEmpty();
  req.checkBody('nominal', 'Nominal is required').notEmpty();
  req.checkBody('nominal', 'Only numbers').isNumeric();
  var validEorros = req.validationErrors();
  if (validEorros) {
    res.json({
      success: false,
      message: validEorros
    });
  } else {
    var add = new db.pengeluaran({
      name: req.body.name,
      keterangan: req.body.keterangan,
      nominal: req.body.nominal
    });
    add.save(function(err) {
      if (err) return res.status(401).send();
      if (!err) res.json({
        succes: true,
        message: 'succes insert pengeluaran'
      });
    });
  }
});

router.delete('/pemasukan/delete/:id', isAuthenticated, function(req, res, next) {
  db.pemasukan.remove({
    _id: req.params.id
  }, function(err, data) {
    if (err) return res.status(401).send();
    if (!err) return res.json({
      succes: true,
      message: 'succes delete pemasukan'
    });
  });
});

router.delete('/pengeluaran/delete/:id', isAuthenticated, function(req, res, next) {
  db.pengeluaran.remove({
    _id: req.params.id
  }, function(err, data) {
    if (err) return res.status(401).send();
    if (!err) return res.json({
      succes: true,
      message: 'succes delete pengeluaran'
    });
  });
});

router.put('/pemasukan/update/:id', isAuthenticated, function(req, res, next) {
  var data = {
    name: req.body.name,
    keterangan: req.body.keterangan,
    nominal: req.body.nominal
  };
  db.pemasukan.update({
    _id: req.params.id
  }, data, function(err, data) {
    if (err) return res.status(401).send();
    if (!err) res.json({
      succes: true,
      message: 'succes update pemasukan'
    });
  });
});

router.put('/pengeluaran/update/:id', isAuthenticated, function(req, res, next) {
  var data = {
    name: req.body.name,
    keterangan: req.body.keterangan,
    nominal: req.body.nominal
  };
  db.pengeluaran.update({
    _id: req.params.id
  }, data, function(err, data) {
    if (err) return res.status(401).send();
    if (!err) res.json({
      succes: true,
      message: 'succes update pengeluaran'
    });
  });
});

module.exports = router;
