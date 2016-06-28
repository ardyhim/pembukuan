var mongoose = require('mongoose'),
    config = require('../bin/config'),
    db = mongoose.connection,
    Schema = mongoose.Schema,
    SchemaUsers,
    SchemaPemasukan,
    SchemaPengeluaran;
mongoose.connect(config.monggo);

SchemaUsers = new Schema({
  username  : String,
  password  : String,
  dete      : {type: Date, default: Date.now}
});
exports.users = db.model('users', SchemaUsers);

SchemaPemasukan = new Schema({
  name: String,
  keterangan: String,
  nominal: Number,
  date: {type: Date, default: Date.now}
});
exports.pemasukan = db.model('pemasukan', SchemaPemasukan);

SchemaPengeluaran = new Schema({
  name: String,
  keterangan: String,
  nominal: Number,
  date: {type: Date, default: Date.now}
});
exports.pengeluaran = db.model('pengeluaran', SchemaPengeluaran);
