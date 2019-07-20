/*
*
*
*       Complete the API routing below
*
*
*/
const dbFunctions = require('../db-functions')
const postThread = dbFunctions.postThread;
const postComment = dbFunctions.postComment;
const getBoard = dbFunctions.getBoard;
const getThread = dbFunctions.getThread;
const modifyThread = dbFunctions.modifyThread;
const modifyComment = dbFunctions.modifyComment;

'use strict';

var expect = require('chai').expect;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post((req, res) => {
    postThread(req, res)
  })
    .get((req, res) => {
    getBoard(req, res)
  })
    .delete((req, res) => {
    modifyThread(req, res)
  })
    .put((req, res) => {
    modifyThread(req, res)
  })
    
  app.route('/api/replies/:board')
    .post((req, res) => {
    postComment(req, res)
  })
    .get((req, res) => {
    getThread(req, res)
  })
    .delete((req, res) => {
    modifyComment(req, res)
  })
    .put((req, res) => {
    modifyComment(req, res)
  })
};
