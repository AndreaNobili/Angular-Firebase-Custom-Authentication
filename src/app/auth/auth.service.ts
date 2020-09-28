import { Injectable } from '@angular/core';

import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private eventAuthError = new BehaviorSubject<string>("");
  eventAuthError$ = this.eventAuthError.asObservable();

  newUser: any;

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private router: Router
    )
    { }

    getUserState() {
      return this.afAuth.authState;
    }

    login( email: string, password: string) {
      this.afAuth.signInWithEmailAndPassword(email, password)
        .catch(error => {
          this.eventAuthError.next(error);
        })
        .then(userCredential => {
          if(userCredential) {
            this.router.navigate(['/home']);
          }
        })
    }

    createUser(user) {
      console.log(user);

      if(user.password != user.password_confirmation) {
        let passwordError: any = new Object();
        passwordError["message"] = "Inserted password and inserted password confirmation are different";
        this.eventAuthError.next(passwordError);
      }
      else {
        this.afAuth.createUserWithEmailAndPassword(user.email, user.password)
          .then( userCredential => {
            this.newUser = user;
            console.log(userCredential);
            userCredential.user.updateProfile( {
              displayName: user.firstName + ' ' + user.lastName
            });

            this.insertUserData(userCredential)
              .then(() => {
                this.router.navigate(['/home']);
              });
          })
          .catch( error => {
            console.log(error);
            console.log(typeof error);
            this.eventAuthError.next(error);    // Emit the event passing the error object
          });
        }
    }

    insertUserData(userCredential: firebase.auth.UserCredential) {
      return this.db.doc(`Users/${userCredential.user.uid}`).set({
        email: this.newUser.email,
        firstname: this.newUser.firstName,
        lastname: this.newUser.lastName,
        role: 'network user'
      })
    }

    logout() {
      return this.afAuth.signOut();
    }
}
