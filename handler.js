'use strict';

const mysql = require('mysql');
const request = require('request');
const cheerio = require('cheerio');
const async = require('async');

module.exports.hello = (event, context, callback) => {
  
  const conn = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.USER,
    password: process.env.PWD,
    database: process.env.DB
  });

  var tasks = [
    function (callback) {
      let arr = new Array();
      let url = process.env.URL;

      request(url, function (error, response, body) {
        const $ = cheerio.load(body);
        
        $('#popular_srch_lst li').map(function () {
          arr.push(new Array($(this).find('em').text().replace('위', '').trim()
            , $(this).find('.txt').text().trim()
            , $(this).find('.vary').text().trim()));
        });

        callback(null, arr);
      });
    },
    function (data, callback) {
      let sql = "INSERT INTO rank (rank, keyword, fluctuation) VALUES ?";
      conn.query(sql, [data], function (err, result) {
        if (err) throw err;
        console.log(result);
        conn.end();

        callback(null, result);
      });
    }
  ];

  async.waterfall(tasks, function (err, result) {
    if (err)
      console.log('err');
    else
      console.log('done');
    
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        result: result.affectedRows
      })
    });
  });

};
