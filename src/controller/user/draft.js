const {
  cloudinary,
  deleteFromCloudinary,
  uploadFileToCloudinary,
  cleanupLocalFile,
} = require("../../config/cloudinary");
const draftModel = require("../../model/draftModel");
const fs = require("fs");
const path = require("path");
// exports.draftData = async (req, res) => {
//   try {
//     console.log("draft data post", req.body);
//     const data = req.body;
//     const userId = req.user.id;
//     const objData = {
//       content: data.content,
//       title: data?.title,
//       isDrafy: true,
//       userId: req.user.id,
//       noteId: data?.noteId,
//       draft: data?.draftId,
//     };
//     const draftData = await draftModel.findOne({ userId: userId, noteId });
//     if (draftData) {
//       await draftModel.updateOne(
//         { userId: userId },
//         { $set: { content: data.content } },
//       );
//     } else {
//       await draftModel.create(objData);
//       res.json({
//         status: "success",
//         message: "Draft created successfully",
//         data: objData,
//       });
//     }
//   } catch (error) {
//     res.status(501).json({
//       message: "Internal Server Error",
//     });
//   }
// };

// exports.draftData = async (req, res) => {
//   try {
//     const files = req?.files;
//     const { content, title, noteId, id } = req.body;
//     let attachments = [];
//     console.log("add draft", req.body);
//     if (files) {
//       files?.map((val) =>
//         attachments.push({
//           filename: val?.filename,
//           path: `https://4frnn03l-3000.inc1.devtunnels.ms/${val?.path}`,
//           mimetype: val?.mimetype,
//           size: val?.size,
//         }),
//       );
//     }
//     const userId = req.user.id;

//     let draft = null;

//     // 1. Check by Draft ID
//     if (id) {
//       draft = await draftModel.findOne({
//         _id: id,
//         userId,
//       });
//     }

//     // 2. Check by Note ID
//     if (!draft && noteId) {
//       draft = await draftModel.findOne({
//         userId,
//         noteId,
//       });
//     }

//     // 3. Update Existing Draft
//     if (draft) {
//       draft.title = title;
//       draft.content = content;
//       draft.noteId = noteId;
//       draft.draftId = id;
//       draft.attachments = attachments ? attachments : [];
//       await draft.save();

//       return res.status(200).json({
//         status: "success",
//         message: "Draft updated successfully",
//         data: draft,
//       });
//     }

//     // 4. Create New Draft
//     const newDraft = await draftModel.create({
//       title,
//       content,
//       noteId,
//       userId,
//       isDraft: true,
//       attachments: attachments ? attachments : [],
//     });

//     return res.status(201).json({
//       status: "success",
//       message: "Draft created successfully",
//       data: newDraft,
//     });
//   } catch (error) {
//     console.error("Draft Error:", error);

//     return res.status(500).json({
//       status: "failed",
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };
// exports.draftData = async (req, res) => {
//   try {
//     const files = req.files || [];
//     console.log("'file", files);

//     const {
//       content,
//       title,
//       noteId,
//       draftId,
//       existingAttachments = "[]",
//       removedAttachmentIds = "[]",
//     } = req.body;

//     const userId = req.user.id;

//     let parsedExistingAttachments = [];
//     let parsedRemovedAttachments = [];

//     try {
//       parsedExistingAttachments = JSON.parse(existingAttachments);
//       parsedRemovedAttachments = JSON.parse(removedAttachmentIds);
//     } catch (err) {
//       return res.status(400).json({
//         status: "failed",
//         message: "Invalid attachment data",
//       });
//     }

//     // Delete removed attachments from Cloudinary
//     if (parsedRemovedAttachments.length) {
//       for (const attachment of parsedExistingAttachments) {
//         const shouldDelete =
//           parsedRemovedAttachments.includes(attachment.public_id?.toString()) ||
//           parsedRemovedAttachments.includes(attachment.path?.toString());

//         if (shouldDelete && attachment.public_id) {
//           try {
//             await cloudinary.uploader.destroy(attachment.public_id, {
//               resource_type: attachment.mimetype?.startsWith("image/")
//                 ? "image"
//                 : "raw",
//             });
//           } catch (err) {
//             console.error("Cloudinary Delete Error:", err.message);
//           }
//         }
//       }
//     }

//     // Keep only non removed attachments
//     const filteredAttachments = parsedExistingAttachments.filter(
//       (attachment) =>
//         !parsedRemovedAttachments.includes(attachment.public_id) &&
//         !parsedRemovedAttachments.includes(attachment.path),
//     );

//     // Upload new files
//     const newAttachments = [];

//     if (files.length) {
//       for (const file of files) {
//         const uploaded = await cloudinary.uploader.upload(file.path, {
//           folder: "notes",
//           resource_type: "auto",
//         });
//         console.log("upload", uploaded);
//         newAttachments.push({
//           public_id: uploaded.public_id,
//           filename: file.originalname,
//           path: uploaded.secure_url,
//           mimetype: file.mimetype,
//           size: file.size,
//         });

//         // remove local temp file
//         try {
//           fs.unlinkSync(file.path);
//         } catch (err) {
//           console.error("File Delete Error:", err.message);
//         }
//       }
//     }

//     const finalAttachments = [...filteredAttachments, ...newAttachments];

//     let draft = null;

//     // Find by draft id
//     if (draftId) {
//       draft = await draftModel.findOne({
//         _id: draftId,
//         userId,
//       });
//     }

//     // Find by note id
//     if (!draft && noteId) {
//       draft = await draftModel.findOne({
//         userId,
//         noteId,
//       });
//     }

//     // Update Draft
//     if (draft) {
//       draft.title = title;
//       draft.content = content;
//       draft.noteId = noteId;
//       draft.attachments = finalAttachments;

//       await draft.save();

//       return res.status(200).json({
//         status: "success",
//         message: "Draft updated successfully",
//         data: draft,
//       });
//     }

//     // Create Draft
//     const newDraft = await draftModel.create({
//       title,
//       content,
//       noteId,
//       userId,
//       isDraft: true,
//       attachments: finalAttachments,
//     });

//     return res.status(201).json({
//       status: "success",
//       message: "Draft created successfully",
//       data: newDraft,
//     });
//   } catch (error) {
//     console.error("Draft Error:", error);

//     return res.status(500).json({
//       status: "failed",
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

// exports.draftData = async (req, res) => {
//   const uploadedFiles = []; // Track files for cleanup on error

//   try {
//     const files = req.files || [];
//     const {
//       content,
//       title,
//       noteId,
//       id: draftId,
//       existingAttachments = "[]",
//       removedAttachmentIds = "[]",
//     } = req.body;

//     const userId = req.user.id;

//     console.log("=== DRAFT DATA REQUEST ===");
//     console.log("User ID:", userId);
//     console.log("Files Count:", files.length);
//     console.log("Existing Attachments:", existingAttachments);
//     console.log("Removed Attachments:", removedAttachmentIds);

//     // ============================================
//     // 1. VALIDATE & PARSE JSON DATA
//     // ============================================
//     let parsedExistingAttachments = [];
//     let parsedRemovedAttachments = [];

//     try {
//       parsedExistingAttachments = JSON.parse(existingAttachments);
//       parsedRemovedAttachments = JSON.parse(removedAttachmentIds);
//     } catch (err) {
//       console.error("JSON Parse Error:", err);
//       return res.status(400).json({
//         status: "failed",
//         message: "Invalid attachment data format",
//         error: err.message,
//       });
//     }

//     // ============================================
//     // 2. DELETE REMOVED ATTACHMENTS FROM CLOUDINARY
//     // ============================================
//     if (parsedRemovedAttachments.length > 0) {
//       console.log("Deleting attachments:", parsedRemovedAttachments);

//       for (const attachment of parsedExistingAttachments) {
//         const publicId = attachment.public_id?.toString();
//         const shouldDelete =
//           parsedRemovedAttachments.includes(publicId) ||
//           parsedRemovedAttachments.includes(attachment.path?.toString());

//         if (shouldDelete && publicId) {
//           // Determine resource type
//           const resourceType =
//             attachment.resource_type || getResourceType(attachment.mimetype);

//           await deleteFromCloudinary(publicId, resourceType);
//         }
//       }
//     }

//     // ============================================
//     // 3. FILTER OUT REMOVED ATTACHMENTS
//     // ============================================
//     const filteredAttachments = parsedExistingAttachments?.filter(
//       (attachment) =>
//         !parsedRemovedAttachments.includes(attachment.public_id) &&
//         !parsedRemovedAttachments.includes(attachment.path),
//     );

//     console.log("Filtered Attachments Count:", filteredAttachments.length);

//     // ============================================
//     // 4. UPLOAD NEW FILES
//     // ============================================
//     const newAttachments = [];

//     if (files.length > 0) {
//       console.log("Uploading new files...");

//       for (const file of files) {
//         try {
//           uploadedFiles.push(file.path); // Track for cleanup

//           const uploadedAttachment = await uploadFileToCloudinary(file);
//           newAttachments.push(uploadedAttachment);

//           // Clean up local file
//           cleanupLocalFile(file.path);
//         } catch (uploadError) {
//           console.error("File Upload Failed:", uploadError);

//           // Clean up any uploaded files on error
//           for (const attachment of newAttachments) {
//             await deleteFromCloudinary(
//               attachment.public_id,
//               attachment.resource_type,
//             );
//           }

//           // Clean up local files
//           uploadedFiles.forEach((filePath) => cleanupLocalFile(filePath));

//           return res.status(400).json({
//             status: "failed",
//             message: "File upload failed",
//             error: uploadError.message || uploadError,
//             file: file.originalname,
//           });
//         }
//       }
//     }

//     console.log("New Attachments Count:", newAttachments.length);

//     // ============================================
//     // 5. COMBINE FINAL ATTACHMENTS
//     // ============================================
//     const finalAttachments = [...filteredAttachments, ...newAttachments];

//     console.log("Final Attachments Count:", finalAttachments.length);

//     // ============================================
//     // 6. FIND OR CREATE DRAFT
//     // ============================================
//     let draft = null;

//     // Search by draft ID first
//     if (draftId) {
//       draft = await draftModel.findOne({
//         _id: draftId,
//         userId,
//       });
//       console.log("Found draft by ID:", draftId, "| Exists:", !!draft);
//     }

//     // Search by note ID if not found
//     if (!draft && noteId) {
//       draft = await draftModel.findOne({
//         userId,
//         noteId,
//       });
//       console.log("Found draft by noteId:", noteId, "| Exists:", !!draft);
//     }

//     // ============================================
//     // 7. UPDATE OR CREATE DRAFT
//     // ============================================
//     if (draft) {
//       console.log("Updating existing draft...");

//       draft.title = title;
//       draft.content = content;
//       draft.noteId = noteId;
//       draft.attachments = finalAttachments;
//       draft.updatedAt = new Date();

//       await draft.save();

//       console.log("Draft updated successfully");

//       return res.status(200).json({
//         status: "success",
//         message: "Draft updated successfully",
//         data: draft,
//       });
//     }

//     // Create new draft
//     console.log("Creating new draft...");

//     const newDraft = await draftModel.create({
//       title,
//       content,
//       noteId,
//       userId,
//       isDraft: true,
//       attachments: finalAttachments,
//     });

//     console.log("Draft created successfully");

//     return res.status(201).json({
//       status: "success",
//       message: "Draft created successfully",
//       data: newDraft,
//     });
//   } catch (error) {
//     console.error("=== DRAFT ERROR ===", error);

//     // Clean up any uploaded files on error
//     uploadedFiles.forEach((filePath) => cleanupLocalFile(filePath));

//     return res.status(500).json({
//       status: "failed",
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };
function safeParseAttachments(data) {
  try {
    // If already an array, return it
    if (Array.isArray(data)) {
      console.log("✓ Attachments already an array");
      return data;
    }

    // If null, undefined, or empty string, return empty array
    if (!data || data === "" || data === "null" || data === "undefined") {
      console.log("✓ Attachments is empty");
      return [];
    }

    // If it's a string, try to parse it
    if (typeof data === "string") {
      const parsed = JSON.parse(data);

      // Check if parsed result is an array
      if (Array.isArray(parsed)) {
        console.log("✓ Parsed attachments from string");
        return parsed;
      }

      // If parsed is an object but not array, return empty array
      console.warn("⚠ Parsed data is not array:", parsed);
      return [];
    }

    // Fallback
    console.warn("⚠ Unknown attachments format:", typeof data);
    return [];
  } catch (err) {
    console.error("❌ Parse error:", err.message);
    console.error("Original data:", data);
    return [];
  }
}
function ensureAttachmentObject(attachment) {
  try {
    // If it's already an object, return it
    if (typeof attachment === "object" && attachment !== null) {
      return attachment;
    }

    // If it's a string, parse it
    if (typeof attachment === "string") {
      const parsed = JSON.parse(attachment);
      return typeof parsed === "object" ? parsed : null;
    }

    return null;
  } catch (err) {
    console.error("❌ Failed to convert attachment to object:", err);
    return null;
  }
}
function normalizeAttachments(attachmentsArray) {
  if (!Array.isArray(attachmentsArray)) {
    return [];
  }

  return attachmentsArray
    .map((att) => {
      // Ensure it's an object, not a string
      const objAtt = ensureAttachmentObject(att);

      if (!objAtt) return null;

      // Normalize field names (handle different naming conventions)
      return {
        public_id: objAtt.public_id || objAtt.publicId || "",
        filename: objAtt.filename || objAtt.name || objAtt.originalname || "",
        path: objAtt.path || objAtt.url || objAtt.cloudinary_url || "",
        mimetype: objAtt.mimetype || objAtt.type || "",
        size: objAtt.size || 0,
        resource_type: objAtt.resource_type || "",
        cloudinary_url:
          objAtt.cloudinary_url || objAtt.url || objAtt.path || "",
      };
    })
    .filter((att) => att !== null); // Remove null entries
}
// exports.draftData = async (req, res) => {
//   const uploadedFiles = [];

//   try {
//     const files = req.files || [];
//     const {
//       content,
//       title,
//       noteId,
//       id: draftId,
//       existingAttachments = "[]",
//       removedAttachmentIds = "[]",
//     } = req.body;

//     const userId = req.user.id;

//     console.log("=== DRAFT DATA REQUEST ===");
//     console.log("📝 Title:", title);
//     console.log("📄 Content length:", content?.length || 0);
//     console.log("📎 Files count:", files.length);
//     console.log("🆔 User ID:", userId);
//     console.log(
//       "Existing Attachments raw:",
//       typeof existingAttachments,
//       existingAttachments,
//     );
//     console.log(
//       "Removed Attachments raw:",
//       typeof removedAttachmentIds,
//       removedAttachmentIds,
//     );

//     // ============================================
//     // 1. SAFELY PARSE ATTACHMENT DATA
//     // ============================================
//     console.log("\n📊 Parsing attachment data...");

//     const parsedExistingAttachments = safeParseAttachments(existingAttachments);
//     const parsedRemovedAttachments = safeParseAttachments(removedAttachmentIds);

//     console.log("✓ Existing attachments:", parsedExistingAttachments.length);
//     console.log("✓ Removed attachments:", parsedRemovedAttachments.length);

//     // ============================================
//     // 2. DELETE REMOVED ATTACHMENTS
//     // ============================================
//     if (parsedRemovedAttachments.length > 0) {
//       console.log("\n🗑️ Removing attachments...");

//       for (const attachmentId of parsedRemovedAttachments) {
//         // Try to find the attachment in existing list
//         const attachment = parsedExistingAttachments.find(
//           (att) =>
//             att.public_id === attachmentId ||
//             att.path === attachmentId ||
//             att._id === attachmentId,
//         );

//         if (attachment) {
//           const resourceType =
//             attachment.resource_type || getResourceType(attachment.mimetype);
//           await deleteFromCloudinary(attachment.public_id, resourceType);
//         }
//       }
//     }

//     // ============================================
//     // 3. FILTER OUT REMOVED ATTACHMENTS
//     // ============================================
//     const filteredAttachments = parsedExistingAttachments.filter(
//       (attachment) => {
//         const isRemoved =
//           parsedRemovedAttachments.includes(attachment.public_id) ||
//           parsedRemovedAttachments.includes(attachment.path) ||
//           parsedRemovedAttachments.includes(attachment._id?.toString());

//         return !isRemoved;
//       },
//     );

//     console.log("✓ Filtered attachments count:", filteredAttachments.length);

//     // ============================================
//     // 4. UPLOAD NEW FILES
//     // ============================================
//     const newAttachments = [];

//     if (files.length > 0) {
//       console.log("\n📤 Uploading new files...");

//       for (const file of files) {
//         try {
//           uploadedFiles.push(file.path);

//           const uploadedAttachment = await uploadFileToCloudinary(file);
//           newAttachments.push(uploadedAttachment);

//           cleanupLocalFile(file.path);
//         } catch (uploadError) {
//           console.error("❌ Upload failed:", uploadError);

//           // Cleanup on error
//           for (const attachment of newAttachments) {
//             await deleteFromCloudinary(
//               attachment.public_id,
//               attachment.resource_type,
//             );
//           }

//           uploadedFiles.forEach((filePath) => cleanupLocalFile(filePath));

//           return res.status(400).json({
//             status: "failed",
//             message: "File upload failed",
//             error: uploadError.message,
//             file: file.originalname,
//           });
//         }
//       }
//     }

//     console.log("✓ New attachments count:", newAttachments.length);

//     // ============================================
//     // 5. COMBINE ATTACHMENTS
//     // ============================================
//     const finalAttachments = [...filteredAttachments, ...newAttachments];
//     console.log("✓ Final attachments count:", finalAttachments.length);

//     // ============================================
//     // 6. FIND EXISTING DRAFT
//     // ============================================
//     console.log("\n🔍 Finding draft...");
//     let draft = null;

//     if (draftId) {
//       draft = await draftModel.findOne({
//         _id: draftId,
//         userId,
//       });
//       console.log("By ID:", draft ? "✓ Found" : "✗ Not found");
//     }

//     if (!draft && noteId) {
//       draft = await draftModel.findOne({
//         userId,
//         noteId,
//       });
//       console.log("By noteId:", draft ? "✓ Found" : "✗ Not found");
//     }

//     // ============================================
//     // 7. UPDATE OR CREATE DRAFT
//     // ============================================
//     if (draft) {
//       console.log("\n📝 Updating draft...");

//       draft.title = title;
//       draft.content = content;
//       draft.noteId = noteId;
//       draft.attachments = finalAttachments;
//       draft.updatedAt = new Date();

//       await draft.save();

//       console.log("✅ Draft updated successfully");

//       return res.status(200).json({
//         status: "success",
//         message: "Draft updated successfully",
//         data: draft,
//       });
//     }

//     console.log("\n✨ Creating new draft...");

//     const newDraft = await draftModel.create({
//       title,
//       content,
//       noteId,
//       userId,
//       isDraft: true,
//       attachments: finalAttachments,
//     });

//     console.log("✅ Draft created successfully");

//     return res.status(201).json({
//       status: "success",
//       message: "Draft created successfully",
//       data: newDraft,
//     });
//   } catch (error) {
//     console.error("\n=== ERROR ===", error);

//     // Cleanup on error
//     uploadedFiles.forEach((filePath) => cleanupLocalFile(filePath));

//     return res.status(500).json({
//       status: "failed",
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

exports.draftData = async (req, res) => {
  const uploadedFiles = [];

  try {
    const files = req.files || [];
    const {
      content,
      title,
      noteId,
      id: draftId,
      existingAttachments = "[]",
      removedAttachmentIds = "[]",
    } = req.body;

    const userId = req.user.id;

    let parsedExistingAttachments = safeParseAttachments(existingAttachments);
    const parsedRemovedAttachments = safeParseAttachments(removedAttachmentIds);
    parsedExistingAttachments = normalizeAttachments(parsedExistingAttachments);

    // DEBUG: Log first attachment to verify it's an object
    if (parsedExistingAttachments.length > 0) {
      console.log("Sample attachment:", {
        type: typeof parsedExistingAttachments[0],
        isObject: typeof parsedExistingAttachments[0] === "object",
        keys: Object.keys(parsedExistingAttachments[0] || {}),
      });
    }

    // ============================================
    // 3. DELETE REMOVED ATTACHMENTS FROM CLOUDINARY
    // ============================================
    if (parsedRemovedAttachments.length > 0) {
      for (const attachmentId of parsedRemovedAttachments) {
        const attachment = parsedExistingAttachments.find(
          (att) =>
            att.public_id === attachmentId ||
            att.path === attachmentId ||
            att._id === attachmentId,
        );

        if (attachment) {
          const resourceType = attachment.resource_type || "image";
          await deleteFromCloudinary(attachment.public_id, resourceType);
        }
      }
    }
    const filteredAttachments = parsedExistingAttachments.filter(
      (attachment) => {
        const isRemoved =
          parsedRemovedAttachments.includes(attachment.public_id) ||
          parsedRemovedAttachments.includes(attachment.path) ||
          parsedRemovedAttachments.includes(attachment._id?.toString());

        return !isRemoved;
      },
    );
    const newAttachments = [];

    if (files.length > 0) {
      for (const file of files) {
        try {
          uploadedFiles.push(file.path);

          const uploadedAttachment = await uploadFileToCloudinary(file);
          newAttachments.push(uploadedAttachment);

          cleanupLocalFile(file.path);
        } catch (uploadError) {
          // Cleanup on error
          for (const attachment of newAttachments) {
            await deleteFromCloudinary(
              attachment.public_id,
              attachment.resource_type,
            );
          }

          uploadedFiles.forEach((filePath) => cleanupLocalFile(filePath));

          return res.status(400).json({
            status: "failed",
            message: "File upload failed",
            error: uploadError.message,
            file: file.originalname,
          });
        }
      }
    }

    let finalAttachments = [...filteredAttachments, ...newAttachments];

    // ✅ CRITICAL: Normalize all attachments before saving
    finalAttachments = normalizeAttachments(finalAttachments);

    finalAttachments.forEach((att, index) => {
      if (typeof att !== "object") {
        console.warn(`⚠️ Attachment ${index} is not an object!`, typeof att);
      }
    });
    let draft = null;

    if (draftId) {
      draft = await draftModel.findOne({
        _id: draftId,
        userId,
      });
      console.log("By ID:", draft ? "✓ Found" : "✗ Not found");
    }

    if (!draft && noteId) {
      draft = await draftModel.findOne({
        userId,
        noteId,
      });
      console.log("By noteId:", draft ? "✓ Found" : "✗ Not found");
    }

    // ============================================
    // 8. UPDATE OR CREATE DRAFT
    // ============================================
    if (draft) {
      console.log("\n📝 Updating draft...");

      draft.title = title;
      draft.content = content;
      draft.noteId = noteId;
      draft.attachments = finalAttachments; // ✅ Array of objects, not strings
      draft.updatedAt = new Date();

      await draft.save();

      console.log("✅ Draft updated successfully");

      return res.status(200).json({
        status: "success",
        message: "Draft updated successfully",
        data: draft,
      });
    }

    console.log("\n✨ Creating new draft...");

    const newDraft = await draftModel.create({
      title,
      content,
      noteId,
      userId,
      isDraft: true,
      attachments: finalAttachments, // ✅ Array of objects, not strings
    });

    console.log("✅ Draft created successfully");

    return res.status(201).json({
      status: "success",
      message: "Draft created successfully",
      data: newDraft,
    });
  } catch (error) {
    console.error("\n=== ERROR ===", error);

    // Cleanup on error
    uploadedFiles.forEach((filePath) => cleanupLocalFile(filePath));

    return res.status(500).json({
      status: "failed",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.draftDataGet = async (req, res) => {
  try {
    console.log(req.user.id);
    const draftData = await draftModel.find({ userId: req.user.id });
    // console.log(draftData);
    if (draftData) {
      res.json({
        status: "success",
        message: "Draft get successfully",
        data: draftData,
      });
    } else {
      res.status(400).json({
        status: "failed",
        message: "Draft not get",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Internal Server Error",
    });
  }
};

exports.deleteDraft = async (req, res) => {
  try {
    const id = req.user.id;
    const deleteData = await draftModel.deleteMany({ userId: id });
    if (deleteData) {
      res.json({
        status: "success",
        message: "Draft deleted successfully",
        data: deleteData,
      });
    } else {
      res.status(400).json({
        status: "failed",
        message: "Draft not deleted",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Internal Server Error",
    });
  }
};
exports.deleteDraftById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteData = await draftModel.deleteOne({ _id: id });
    if (deleteData) {
      res.json({
        status: "success",
        message: "Draft deleted successfully",
        data: deleteData,
      });
    } else {
      res.status(400).json({
        status: "failed",
        message: "Draft not deleted",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Internal Server Error",
    });
  }
};
