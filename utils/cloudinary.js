// backend/utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

let _enabled = true;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  _enabled = false;
}

export const isCloudinaryEnabled = () => _enabled;

/**
 * Upload to Cloudinary.
 * Accepts either:
 *  - filePath: path to a local file (string) OR
 *  - buffer: Buffer containing file bytes
 * Returns secure_url string on success.
 */
export const uploadToCloudinary = async ({ filePath, buffer, resource_type = "auto", folder } = {}) => {
  if (!isCloudinaryEnabled()) throw new Error("Cloudinary not configured");

  if (buffer) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type, folder },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(Buffer.from(buffer));
    });
  } else if (filePath) {
    const res = await cloudinary.uploader.upload(filePath, { resource_type, folder });
    return res.secure_url;
  } else {
    throw new Error("No filePath or buffer provided to uploadToCloudinary");
  }
};

/**
 * Remove local temporary file (best-effort)
 * kept for compatibility but not required by the memory-only upload flow
 */
export const removeLocalFile = async (filePath) => {
  try {
    const fs = await import("fs-extra");
    await fs.remove(filePath);
  } catch (e) {
    // ignore
  }
};
