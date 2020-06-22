import * as functions from "firebase-functions";
import { db } from "./init";

export const onAddLesson = functions.firestore
  .document("courses/{courseId}/lessons/{lessonId}")
  .onCreate(async (snap, context) =>
    courseTransaction(snap, (course) => ({
      lessonsCount: course.lessonsCount + 1,
    }))
  );

  export const onDeleteLesson = functions.firestore
  .document("courses/{courseId}/lessons/{lessonId}")
  .onDelete(async (snap, context) =>
    courseTransaction(snap, (course) => ({
      lessonsCount: course.lessonsCount - 1,
    }))
  );

function courseTransaction(snap, callback: Function) {
  return db.runTransaction(async (transaction) => {
    const courseRef: any = snap.ref.parent.parent;
    const courseSnap: any = await transaction.get(courseRef);
    const course = courseSnap.data();
    const changes = callback(course);
    transaction.update(courseRef, changes);
  });
}
