// backend/utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs-extra";

let _enabled = false;

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
  _enabled = true;
}

export const isCloudinaryEnabled = () => _enabled;

/**
 * Uploads a local file to Cloudinary and returns secure_url
 * resource_type defaults to 'auto' which supports images and videos
 */
export const uploadToCloudinary = async ({ filePath, resource_type = "auto", folder = "app/uploads" }) => {
  if (!_enabled) throw new Error("Cloudinary not configured");
  const res = await cloudinary.uploader.upload(filePath, {
    resource_type,
    folder,
    use_filename: false,
    unique_filename: true,
  });
  return res.secure_url;
};

/**
 * Remove local temporary file (best-effort)
 */
export const removeLocalFile = async (filePath) => {
  try {
    await fs.remove(filePath);
  } catch (e) {
    // ignore
  }
};
