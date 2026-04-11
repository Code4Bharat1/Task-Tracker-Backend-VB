// utils/getSignedUrl.js
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/s3.js";

export const getFileUrl = async (fileKey) => {
  const command = new GetObjectCommand({
    Bucket: process.env.WASABI_BUCKET_NAME,
    Key: fileKey,
  });

  const url = await getSignedUrl(s3, command);

  return url;
};