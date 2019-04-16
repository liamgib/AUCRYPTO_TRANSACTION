/* test/db_tests.js */
const database = require('../postgres/database_handler');

var expect = require('chai').expect;
let server_id;
let server_key;
let session;

describe('Server database manager', function() {

  context('functions', function() {

    it('should not error on server creation', function(done) {
      database.getServerDatabase().createServer().then(result => {
        try {
          expect(result).to.exist;
          server_id = result[0];
          server_key = result[1];
          expect(server_id).to.be.a('string');
          expect(server_key).to.be.a('string');
          expect(server_id).to.have.length(10)
          done();
        } catch (e) {
          done(e);
        }
      })
    })

    it('login - should error on invalid password', function(done) {
      database.getServerDatabase().loginServer(server_id, 'A').then((result) => {
        try {
          expect(result).to.exist;
          expect(result[0]).to.not.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      })
    })

    it('login - should not error', function(done) {
      database.getServerDatabase().loginServer(server_id, server_key).then((result) => {
        try {
          expect(result).to.exist;
          let ifLoggedIn = result[0];
          session = result[1];
          expect(ifLoggedIn).to.not.equal(false);
          expect(session).to.be.a('string');
          expect(session).to.have.length.above(10);
          done();
        } catch (e) {
          done(e);
        }
      })
    })

    it('session - should error on invalid session', function(done) {
      database.getServerDatabase().isSession("AC").then(isSession => {
        try {
          expect(isSession).to.exist;
          expect(isSession).to.equal(false);
          done();
        } catch (e) {
          done(e);
        }
      })
    })

    it('session - should be valid', function(done) {
      database.getServerDatabase().isSession(session).then(result => {
        try {
          expect(isSession).to.exist;
          expect(isSession).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      })
    })

  });

})