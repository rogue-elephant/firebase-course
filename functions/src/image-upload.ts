import * as functions from "firebase-functions";
import * as path from "path";
import * as os from "os";
import { Storage } from "@google-cloud/storage";
const mkdirp = require("mkdirp");
const spawn =  require("child-process-promise").spawn;
const rimraf = require("rimraf");
import { db } from "./init";

const gcs = new Storage();

export const resizeThumbnail = functions.storage
  .object()
  .onFinalize(async (object, context) => {
    const fileFullPath = object.name || "",
      contentType = object.contentType || "",
      fileDir = path.dirname(fileFullPath),
      fileName = path.basename(fileFullPath),
      tempLocalDir = path.join(os.tmpdir(), fileDir);

    if (!contentType.startsWith("image/") || fileName.startsWith("thumb_")) {
      return null;
    }

    await mkdirp(tempLocalDir);
    const bucket = gcs.bucket(object.bucket);
    const originalImageFile = bucket.file(fileFullPath);

    const tempLocalFile = path.join(os.tmpdir(), fileFullPath);

    console.log(`Downloading image to: ${tempLocalFile}`);

    await originalImageFile.download({ destination: tempLocalFile });

    // Generate thumbnail via ImageMagick (already installed on Firebase)
    const outputFilePath = path.join(fileDir, `thumb_${fileName}`);
    const outputFile = path.join(os.tmpdir(), outputFilePath);
    await spawn(
      "convert",
      [tempLocalFile, "-thumbnail", "510x287 >", outputFile],
      {
        capture: ["stdout", "stderr"],
      }
    );

    // Upload the thumbnail to storage
    const metadata = {
      contentType: object.contentType,
      cacheControl: "public,max-age=2592000, s-maxage=2592000",
    };

    console.log(
      "Uploading the thumbnail to storage:",
      outputFile,
      outputFilePath
    );

    const uploadedFiles = await bucket.upload(outputFile, {
      destination: outputFilePath,
      metadata,
    });

    // delete local temp files that aren't needed anymore
    rimraf.sync(tempLocalDir);

    // delete the original large image file
    await originalImageFile.delete();

    // create link to uploaded file
    const thumbnail = uploadedFiles[0];
    const thumbnailUrl = await thumbnail.getSignedUrl({
      action: "read",
      expires: new Date(3000, 1),
    });

    console.log("Generated signed url: ", thumbnailUrl);

    // save thumbnail link into db
    const filePathFragments = fileFullPath.split("/"),
      courseId = filePathFragments[1];

    console.log("saving thumbnail url to database: ", courseId);

    return db
      .doc(`courses/${courseId}`)
      .update({ uploadedImageUrl: thumbnailUrl });
  });
