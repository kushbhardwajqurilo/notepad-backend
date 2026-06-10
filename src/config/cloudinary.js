const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
dotenv.config({});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
async function uploadFileToCloudinary(file) {
  try {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const absolutePath = path.resolve(file.path);

    console.log("Uploading File:", absolutePath);
    console.log("File Size:", file.size);
    console.log("File Mimetype:", file.mimetype);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    // Determine resource type based on mimetype
    const resourceType = getResourceType(file.mimetype);

    console.log("Resource Type:", resourceType);

    // Upload to Cloudinary with proper configuration
    const uploaded = await cloudinary.uploader.upload(absolutePath, {
      folder: "notes",
      resource_type: resourceType, // ✅ FIXED: Use correct resource type
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      // For documents, disable eager transformations
      ...(resourceType === "raw" && { eager: [] }),
    });

    console.log("Cloudinary Upload Success:", uploaded.public_id);

    return {
      public_id: uploaded.public_id,
      filename: file.originalname,
      path: uploaded.secure_url,
      mimetype: file.mimetype,
      size: file.size,
      cloudinary_url: uploaded.secure_url,
      resource_type: resourceType,
    };
  } catch (uploadError) {
    console.error("Cloudinary Upload Error:", uploadError);
    throw uploadError;
  }
}

async function deleteFromCloudinary(publicId, resourceType = "image") {
  try {
    console.log("Deleting from Cloudinary:", publicId, "Type:", resourceType);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || "image",
      type: "upload",
    });

    console.log("Cloudinary Delete Success:", result);
    return true;
  } catch (deleteError) {
    console.error("Cloudinary Delete Error:", deleteError);
    // Don't throw - continue even if delete fails
    return false;
  }
}
function getResourceType(mimetype) {
  if (mimetype.startsWith("image/")) {
    return "image";
  }
  if (mimetype.startsWith("video/")) {
    return "video";
  }
  // For PDFs, DOCX, etc.
  return "raw";
}
function validateFile(file) {
  // Max file size: 100MB
  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 100MB limit. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}
function cleanupLocalFile(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log("Local file deleted:", absolutePath);
      return true;
    }
  } catch (err) {
    console.error("Local File Cleanup Error:", err.message);
  }
  return false;
}

module.exports = {
  cloudinary,
  uploadFileToCloudinary,
  deleteFromCloudinary,
  getResourceType,
  validateFile,
  cleanupLocalFile,
};
