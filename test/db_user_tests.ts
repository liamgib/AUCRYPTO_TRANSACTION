import { expect } from 'chai';
import database_handler from '../app/postgres/database_handler';
const database = new database_handler();
const email = "testinng@test.com.au";
const pass = "aw6rkingpass!?";
let verify_key:string;
let verify_pin:string;
let session:string;

describe('User database manager', function() {

    context('functions', function() {
      it('user deletion - should error when it does not exist', function(done) {
        database.getUserDatabase().deleteUser("AC").then((ifDeleted:boolean) => {
          try {
            expect(ifDeleted).to.exist;
            expect(ifDeleted).to.equal(false);
            done();
          } catch (e) {
            done(e);
          }
        })
      })
  
      it('email checks - should error when it does not exist', function(done) {
        database.getUserDatabase().doesEmailExist("AC").then((ifExists:boolean) => {
          try {
            expect(ifExists).to.exist;
            expect(ifExists).to.equal(false);
            done();
          } catch (e) {
            done(e);
          }
        })
      })
  
     it('create user', function(done) {
        database.getUserDatabase().createUser(email, pass).then((ifCreated:boolean) => {
          try {
            expect(ifCreated).to.exist;
            expect(ifCreated).to.not.equal(false);
            expect(ifCreated).to.be.a('number');
            done();
          } catch (e) {
            done(e);
          }
        })
      })
  
      it('login - should error on not verified', function(done) {
        database.getUserDatabase().loginUser(email, pass).then((result:Array<string>) => {
          try {
            expect(result).to.exist;
            let ifLoggedIn = result[0];
            verify_key = result[1];
            verify_pin = result[2];
            expect(ifLoggedIn).to.not.equal(true);
            expect(verify_key).to.be.a('string');
            expect(verify_pin).to.be.a('number');
            done();
          } catch (e) {
            done(e);
          }
        })
      })
  
      it('verification - should error on invalid key', function(done) {
        database.getUserDatabase().userVerification('A', verify_pin).then((isVerified:boolean) => {
          try {
            expect(isVerified).to.exist;
            expect(isVerified).to.not.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        })
      })
  
      it('verification - should error on invalid pin', function(done) {
        database.getUserDatabase().userVerification(verify_key, '0').then((isVerified:boolean) => {
          try {
            expect(isVerified).to.exist;
            expect(isVerified).to.not.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        })
      })
  
      it('verification - should not error', function(done) {
        database.getUserDatabase().userVerification(verify_key, verify_pin).then((isVerified:boolean) => {
          try {
            expect(isVerified).to.exist;
            expect(isVerified).to.not.equal(false);
            done();
          } catch (e) {
            done(e);
          }
        })
      })
  
      it('login - should error on invalid password', function(done) {
        database.getUserDatabase().loginUser(email, 'A').then((result:Array<boolean>) => {
          try {
            expect(result).to.exist;
            let ifLoggedIn:boolean = result[0];
            expect(ifLoggedIn).to.not.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        })
      })
  
      it('login - should not error', function(done) {
        database.getUserDatabase().loginUser(email, pass).then((result:any) => {
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
        database.getUserDatabase().isSession('notasession').then((isSession:boolean) => {
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
        database.getUserDatabase().isSession(session).then((isSession:boolean) => {
          try {
            expect(isSession).to.exist;
            expect(isSession).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        })
      })
  
      it('user deletion - should not error', function(done) {
        database.getUserDatabase().deleteUser(email).then(ifDeleted => {
          try {
            expect(ifDeleted).to.exist;
            expect(ifDeleted).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        })
      })
    })
  })