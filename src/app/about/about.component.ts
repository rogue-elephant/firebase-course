import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import * as firebase from "firebase/app";
import "firebase/firestore";
import { Course } from "../model/course";
import { AngularFirestore } from "@angular/fire/firestore";
import { of } from 'rxjs';

@Component({
  selector: "about",
  templateUrl: "./about.component.html",
  styleUrls: ["./about.component.css"],
})
export class AboutComponent implements OnInit {
  constructor(private db: AngularFirestore) {}

  ngOnInit() {
    const courseRef = this.db.doc("/courses/42QyjGYM7MMgI8etFilG")
      .snapshotChanges()
      .subscribe(snap => {
        const course:any = snap.payload.data();
        console.log("course.relatedCourseRef", course.relatedCourseRef);
      });

      const ref = this.db.doc("/courses/5p0rJ2ucd3fINYYakCBZ")
        .snapshotChanges()
        .subscribe(
          doc => console.log("ref", doc.payload.ref)
        );
  }

  save() {
    const ngrxCourseRef = this.db.doc("/courses/42QyjGYM7MMgI8etFilG").ref;

    const rxjsCourseRef = this.db.doc("/courses/5p0rJ2ucd3fINYYakCBZ").ref;

    const batch = this.db.firestore.batch();

    batch.update(ngrxCourseRef, {titles:{description: "NGRX Course"}});
    batch.update(rxjsCourseRef, {titles:{description: "RXJS Course"}});

    const batch$ = of(batch.commit());
    batch$.subscribe();
  }

  async runTransaction() {
  const newCounter = await this.db.firestore.runTransaction(async transaction => {
      console.log("Running transaction...");
      const courseRef = this.db.doc("/courses/42QyjGYM7MMgI8etFilG").ref;
      const snap = await transaction.get(courseRef);
      const course = <Course>snap.data();
      const lessonsCount = course.lessonsCount + 1;
      transaction.update(courseRef, {lessonsCount});
      return lessonsCount;
    });

    console.log("results lessons count = ", newCounter);
  }
}
