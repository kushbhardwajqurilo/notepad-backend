const {
  cleanupLocalFile,
  deleteFromCloudinary,
  uploadFileToCloudinary,
} = require("../../config/cloudinary");
const credentialNote = require("../../model/credantialNoteModel");
const NotesModel = require("../../model/notes");

function safeParseAttachments(data) {
  try {
    if (Array.isArray(data)) {
      return data;
    }

    if (!data || data === "" || data === "null" || data === "undefined") {
      return [];
    }

    if (typeof data === "string") {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }

    return [];
  } catch (err) {
    console.error("❌ Parse error:", err.message);
    return [];
  }
}

function ensureAttachmentObject(attachment) {
  try {
    if (typeof attachment === "object" && attachment !== null) {
      return attachment;
    }

    if (typeof attachment === "string") {
      const parsed = JSON.parse(attachment);
      return typeof parsed === "object" ? parsed : null;
    }

    return null;
  } catch (err) {
    console.error("❌ Failed to convert attachment:", err);
    return null;
  }
}

function normalizeAttachments(attachmentsArray) {
  if (!Array.isArray(attachmentsArray)) {
    return [];
  }

  return attachmentsArray
    .map((att) => {
      const objAtt = ensureAttachmentObject(att);

      if (!objAtt) return null;

      return {
        public_id: objAtt.public_id || "",
        filename: objAtt.filename || objAtt.name || objAtt.originalname || "",
        path: objAtt.path || objAtt.url || objAtt.cloudinary_url || "",
        mimetype: objAtt.mimetype || objAtt.type || "",
        size: objAtt.size || 0,
        resource_type: objAtt.resource_type || "",
        cloudinary_url:
          objAtt.cloudinary_url || objAtt.url || objAtt.path || "",
      };
    })
    .filter((att) => att !== null);
}
// exports.addNotes = async (req, res) => {
//   try {
//     console.log("add request", req?.body);
//     const data = req.body;
//     const ObjData = {
//       title: data.title,
//       content: data.content,
//       userId: req.user.id,
//       updateStatus: false,
//     };

//     const dataCreate = await NotesModel.create(ObjData);
//     if (dataCreate) {
//       res.json({
//         status: "success",
//         message: "Notes Created",
//       });
//     } else {
//       res.status(400).json({
//         message: "Notes Not Created",
//       });
//     }
//   } catch (error) {
//     res.status(501).json({
//       message: "Internal Surver Error",
//     });
//   }
// };

exports.addNotes = async (req, res) => {
  const uploadedFiles = [];

  try {
    const files = req.files || [];
    const {
      title,
      content,
      existingAttachments = "[]",
      removedAttachmentIds = "[]",
    } = req.body;

    const userId = req.user.id;

    console.log("=== ADD NOTES REQUEST ===");
    console.log("📝 Title:", title);
    console.log("📄 Content length:", content?.length || 0);
    console.log("📎 Files count:", files.length);
    console.log("🆔 User ID:", userId);
    console.log(
      "Existing Attachments raw:",
      typeof existingAttachments,
      existingAttachments,
    );
    console.log(
      "Removed Attachments raw:",
      typeof removedAttachmentIds,
      removedAttachmentIds,
    );

    // ============================================
    // 1. VALIDATE REQUIRED FIELDS
    // ============================================
    if (!title || title.trim() === "") {
      return res.status(400).json({
        status: "failed",
        message: "Title is required",
      });
    }

    // ============================================
    // 2. SAFELY PARSE ATTACHMENT DATA
    // ============================================
    console.log("\n📊 Parsing attachment data...");

    let parsedExistingAttachments = safeParseAttachments(existingAttachments);
    const parsedRemovedAttachments = safeParseAttachments(removedAttachmentIds);

    console.log("✓ Existing attachments:", parsedExistingAttachments.length);
    console.log("✓ Removed attachments:", parsedRemovedAttachments.length);

    // ============================================
    // 3. NORMALIZE EXISTING ATTACHMENTS
    // ============================================
    console.log("\n🔄 Normalizing attachments...");

    parsedExistingAttachments = normalizeAttachments(parsedExistingAttachments);

    console.log(
      "✓ Normalized existing attachments:",
      parsedExistingAttachments.length,
    );

    if (parsedExistingAttachments.length > 0) {
      console.log("Sample attachment:", {
        type: typeof parsedExistingAttachments[0],
        isObject: typeof parsedExistingAttachments[0] === "object",
      });
    }

    // ============================================
    // 4. DELETE REMOVED ATTACHMENTS FROM CLOUDINARY
    // ============================================
    if (parsedRemovedAttachments.length > 0) {
      console.log("\n🗑️ Removing attachments from Cloudinary...");

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

    // ============================================
    // 5. FILTER OUT REMOVED ATTACHMENTS
    // ============================================
    const filteredAttachments = parsedExistingAttachments.filter(
      (attachment) => {
        const isRemoved =
          parsedRemovedAttachments.includes(attachment.public_id) ||
          parsedRemovedAttachments.includes(attachment.path) ||
          parsedRemovedAttachments.includes(attachment._id?.toString());

        return !isRemoved;
      },
    );

    console.log("✓ Filtered attachments count:", filteredAttachments.length);

    // ============================================
    // 6. UPLOAD NEW FILES
    // ============================================
    const newAttachments = [];

    if (files.length > 0) {
      console.log("\n📤 Uploading new files...");

      for (const file of files) {
        try {
          uploadedFiles.push(file.path);

          const uploadedAttachment = await uploadFileToCloudinary(file);
          newAttachments.push(uploadedAttachment);

          cleanupLocalFile(file.path);
        } catch (uploadError) {
          console.error("❌ Upload failed:", uploadError);

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

    console.log("✓ New attachments count:", newAttachments.length);

    // ============================================
    // 7. COMBINE & NORMALIZE FINAL ATTACHMENTS
    // ============================================
    console.log("\n📦 Combining attachments...");

    let finalAttachments = [...filteredAttachments, ...newAttachments];

    // ✅ CRITICAL: Normalize all attachments before saving
    finalAttachments = normalizeAttachments(finalAttachments);

    console.log("✓ Final attachments count:", finalAttachments.length);

    // Verify all attachments are objects
    console.log("\n🔍 Attachment validation:");
    finalAttachments.forEach((att, index) => {
      if (typeof att !== "object") {
        console.warn(`⚠️ Attachment ${index} is not an object!`, typeof att);
      }
    });

    // ============================================
    // 8. CREATE NOTE
    // ============================================
    console.log("\n✨ Creating note...");

    const noteData = {
      title: title.trim(),
      content: content || "",
      userId: userId,
      updateStatus: false,
      attachments: finalAttachments, // ✅ Array of objects!
    };

    const newNote = await NotesModel.create(noteData);

    if (!newNote) {
      // Cleanup files if note creation failed
      for (const attachment of finalAttachments) {
        await deleteFromCloudinary(
          attachment.public_id,
          attachment.resource_type,
        );
      }

      console.error("❌ Note creation failed");

      return res.status(400).json({
        status: "failed",
        message: "Note creation failed",
      });
    }

    console.log("✅ Note created successfully:", newNote._id);

    // ============================================
    // 9. RETURN SUCCESS RESPONSE
    // ============================================
    return res.status(201).json({
      status: "success",
      message: "Note created successfully",
      data: {
        _id: newNote._id,
        title: newNote.title,
        content: newNote.content,
        attachments: newNote.attachments,
        attachmentCount: newNote.attachments?.length || 0,
        createdAt: newNote.createdAt,
      },
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
exports.getNotes = async (req, res) => {
  try {
    const user = req.user.id;
    const search = req.query?.search?.trim();
    const date = req.query?.date?.trim();

    const filter = {
      userId: user,
    };

    // Search filter
    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          content: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Date filter
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);

      endDate.setDate(endDate.getDate() + 1);

      filter.createdAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const notes = await NotesModel.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: "success",
      message: "Notes retrieved successfully",
      data: notes,
    });
  } catch (error) {
    console.error("getNotes error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
exports.viewNote = async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await NotesModel.findOne({ _id: noteId });

    if (note) {
      res.status(200).json({
        message: "Note retrieved successfully",
        data: note,
      });
    } else {
      res.status(404).json({
        message: "Note not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// exports.updateNote = async (req, res) => {
//   try {
//     const noteId = req.params.id;
//     const updatedData = req.body;

//     const objData = {
//       title: updatedData.title,
//       content: updatedData.content,
//       updateStatus: true,
//     };

//     const note = await NotesModel.findByIdAndUpdate(noteId, objData, {
//       new: true,
//     });

//     if (note) {
//       res.json({
//         status: "success",
//         message: "update Note successfully",
//         data: note,
//       });
//     } else {
//       res.status(404).json({
//         message: "Note not found",
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       message: "Internal Server Error",
//     });
//   }
// };

// old
// exports.updateNote = async (req, res) => {
//   try {
//     const noteId = req.params.id;
//     const updatedData = req.body;

//     const note = await NotesModel.findById(noteId);

//     if (!note) {
//       return res.status(404).json({
//         message: "Note not found",
//       });
//     }

//     // EST/EDT date (America/New_York)
//     const createdDateEST = new Intl.DateTimeFormat("en-CA", {
//       timeZone: "America/New_York",
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     }).format(note.createdAt);

//     const todayEST = new Intl.DateTimeFormat("en-CA", {
//       timeZone: "America/New_York",
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     }).format(new Date());

//     // Agar EST date change ho gayi hai to update mat karo
//     if (createdDateEST !== todayEST) {
//       return res.status(400).json({
//         status: "failed",
//         message: "Note can only be updated on the day it was created.",
//       });
//     }

//     const objData = {
//       title: updatedData.title,
//       content: updatedData.content,
//       updateStatus: true,
//     };

//     const updatedNote = await NotesModel.findByIdAndUpdate(noteId, objData, {
//       new: true,
//     });

//     res.json({
//       status: "success",
//       message: "Update Note successfully",
//       data: updatedNote,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Internal Server Error",
//     });
//   }
// };

// new

exports.updateNote = async (req, res) => {
  const uploadedFiles = [];

  try {
    const noteId = req.params.id;
    const userId = req.user.id;

    const files = req.files || [];

    const { title, content, existingAttachments = "[]" } = req.body;

    const note = await NotesModel.findOne({
      _id: noteId,
      userId,
    });

    if (!note) {
      return res.status(404).json({
        status: "failed",
        message: "Note not found",
      });
    }

    // EST/EDT Date Validation
    const createdDateEST = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(note.createdAt);

    const todayEST = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (createdDateEST !== todayEST) {
      return res.status(400).json({
        status: "failed",
        message: "Note can only be updated on the day it was created.",
      });
    }

    // ==========================
    // Existing Attachments
    // ==========================

    let parsedExistingAttachments = safeParseAttachments(existingAttachments);

    parsedExistingAttachments = normalizeAttachments(parsedExistingAttachments);

    // ==========================
    // Upload New Files
    // ==========================

    const newAttachments = [];

    if (files.length > 0) {
      for (const file of files) {
        try {
          uploadedFiles.push(file.path);

          const uploadedAttachment = await uploadFileToCloudinary(file);

          newAttachments.push(uploadedAttachment);

          cleanupLocalFile(file.path);
        } catch (uploadError) {
          console.error("File Upload Error:", uploadError);

          uploadedFiles.forEach((filePath) => cleanupLocalFile(filePath));

          return res.status(400).json({
            status: "failed",
            message: "File upload failed",
            error: uploadError.message,
          });
        }
      }
    }

    // ==========================
    // Final Attachments Logic
    // ==========================

    const finalAttachments = [...parsedExistingAttachments, ...newAttachments];

    // ==========================
    // Update Data
    // ==========================

    const updateData = {
      updateStatus: true,
    };

    if (typeof title === "string") {
      updateData.title = title.trim();
    }

    if (typeof content === "string") {
      updateData.content = content.trim();
    }

    updateData.attachments = finalAttachments;

    const updatedNote = await NotesModel.findByIdAndUpdate(
      noteId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      status: "success",
      message: "Note updated successfully",
      data: updatedNote,
    });
  } catch (error) {
    console.error("updateNote error:", error);

    uploadedFiles.forEach((filePath) => cleanupLocalFile(filePath));

    return res.status(500).json({
      status: "failed",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const notes = await NotesModel.findById(noteId);
    const createdDateEST = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(notes.createdAt);

    const todayEST = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (createdDateEST !== todayEST) {
      return res.status(400).json({
        status: "failed",
        message: "Cannot delete",
      });
    }
    const note = await NotesModel.findByIdAndDelete(noteId);

    if (note) {
      res.json({
        status: "success",
        message: "Note deleted successfully",
      });
    } else {
      res.status(404).json({
        message: "Note not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.findNotes = async (req, res) => {
  try {
    const data = req.params.data;

    const findContent = await NotesModel.find({
      content: { $regex: data, $options: "i" },
      title: { $regex: data, $options: "i" },
      userId: req.user.id,
    });
    if (findContent) {
      res.json({
        status: "success",
        message: "Note found successfully",
        data: findContent,
      });
    } else {
      res.json({
        status: "failed",
        message: "Note not found",
      });
    }
  } catch (error) {}
};

exports.getBackupNotes = async (req, res) => {
  try {
    const notes = await NotesModel.find({});
    if (notes.length > 0) {
      res.status(200).json({
        message: "Notes retrieved successfully",
        data: notes,
      });
    } else {
      res.status(400).json({
        message: "Notes Not retrieved",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// credentails note
exports.addCredentialNote = async (req, res) => {
  const uploadedFiles = [];

  try {
    const files = req.files || [];
    const {
      title,
      content,
      existingAttachments = "[]",
      removedAttachmentIds = "[]",
    } = req.body;

    const userId = req.user.id;

    let parsedExistingAttachments = safeParseAttachments(existingAttachments);
    const parsedRemovedAttachments = safeParseAttachments(removedAttachmentIds);

    // ============================================
    // 3. NORMALIZE EXISTING ATTACHMENTS
    // ============================================

    parsedExistingAttachments = normalizeAttachments(parsedExistingAttachments);

    if (parsedExistingAttachments.length > 0) {
      console.log("Sample attachment:", {
        type: typeof parsedExistingAttachments[0],
        isObject: typeof parsedExistingAttachments[0] === "object",
      });
    }

    // ============================================
    // 4. DELETE REMOVED ATTACHMENTS FROM CLOUDINARY
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

    // ============================================
    // 5. FILTER OUT REMOVED ATTACHMENTS
    // ============================================
    const filteredAttachments = parsedExistingAttachments.filter(
      (attachment) => {
        const isRemoved =
          parsedRemovedAttachments.includes(attachment.public_id) ||
          parsedRemovedAttachments.includes(attachment.path) ||
          parsedRemovedAttachments.includes(attachment._id?.toString());

        return !isRemoved;
      },
    );

    // ============================================
    // 6. UPLOAD NEW FILES
    // ============================================
    const newAttachments = [];

    if (files.length > 0) {
      console.log("\n📤 Uploading new files...");

      for (const file of files) {
        try {
          uploadedFiles.push(file.path);

          const uploadedAttachment = await uploadFileToCloudinary(file);
          newAttachments.push(uploadedAttachment);

          cleanupLocalFile(file.path);
        } catch (uploadError) {
          console.error("❌ Upload failed:", uploadError);

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

    // ============================================
    // 7. COMBINE & NORMALIZE FINAL ATTACHMENTS
    // ============================================

    let finalAttachments = [...filteredAttachments, ...newAttachments];

    // ✅ CRITICAL: Normalize all attachments before saving
    finalAttachments = normalizeAttachments(finalAttachments);

    // Verify all attachments are objects

    finalAttachments.forEach((att, index) => {
      if (typeof att !== "object") {
        console.warn(`⚠️ Attachment ${index} is not an object!`, typeof att);
      }
    });

    // ============================================
    // 8. CREATE OR UPDATE NOTE (ONE NOTE PER USER)
    // ============================================

    const noteData = {
      content: content || "",
      attachments: finalAttachments,
      updateStatus: true,
    };

    // Find existing note for user
    let note = await credentialNote.findOne({ userId });

    if (note) {
      note.content = noteData.content;
      note.attachments = noteData.attachments;
      note.updateStatus = true;

      await note.save();
    } else {
      note = await credentialNote.create({
        userId,
        content: noteData.content,
        attachments: noteData.attachments,
        updateStatus: false,
      });
    }

    return res.status(200).json({
      status: "success",
      message:
        note.createdAt.getTime() === note.updatedAt.getTime()
          ? "Note created successfully"
          : "Note updated successfully",
      data: {
        _id: note._id,
        content: note.content,
        attachments: note.attachments,
        attachmentCount: note.attachments?.length || 0,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
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
exports.getCredentialNotes = async (req, res) => {
  try {
    const user = req.user.id;
    const search = req.query?.search?.trim();
    const date = req.query?.date?.trim();

    const filter = {
      userId: user,
    };

    // Search filter
    if (search) {
      filter.$or = [
        {
          content: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Date filter
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);

      endDate.setDate(endDate.getDate() + 1);

      filter.createdAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const notes = await credentialNote.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: "success",
      message: "Notes retrieved successfully",
      data: notes,
    });
  } catch (error) {
    console.error("getNotes error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
exports.viewCredentialNote = async (req, res) => {
  try {
    const user = req.user;
    // console.log("user", user);
    // const noteId = req.params.id;

    const note = await credentialNote.findOne({ userId: user.id });

    if (note) {
      res.status(200).json({
        message: "Note retrieved successfully",
        data: note,
      });
    } else {
      res.status(404).json({
        message: "Note not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.updateCredentialNote = async (req, res) => {
  const uploadedFiles = [];

  try {
    const noteId = req.params.id;
    const userId = req.user.id;

    const files = req.files || [];

    const { content, existingAttachments = "[]" } = req.body;

    const note = await credentialNote.findOne({
      _id: noteId,
      userId,
    });

    if (!note) {
      return res.status(404).json({
        status: "failed",
        message: "Note not found",
      });
    }

    // EST/EDT Date Validation
    const createdDateEST = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(note.createdAt);

    const todayEST = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (createdDateEST !== todayEST) {
      return res.status(400).json({
        status: "failed",
        message: "Note can only be updated on the day it was created.",
      });
    }

    // ==========================
    // Existing Attachments
    // ==========================

    let parsedExistingAttachments = safeParseAttachments(existingAttachments);

    parsedExistingAttachments = normalizeAttachments(parsedExistingAttachments);

    // ==========================
    // Upload New Files
    // ==========================

    const newAttachments = [];

    if (files.length > 0) {
      for (const file of files) {
        try {
          uploadedFiles.push(file.path);

          const uploadedAttachment = await uploadFileToCloudinary(file);

          newAttachments.push(uploadedAttachment);

          cleanupLocalFile(file.path);
        } catch (uploadError) {
          console.error("File Upload Error:", uploadError);

          uploadedFiles.forEach((filePath) => cleanupLocalFile(filePath));

          return res.status(400).json({
            status: "failed",
            message: "File upload failed",
            error: uploadError.message,
          });
        }
      }
    }

    // ==========================
    // Final Attachments Logic
    // ==========================

    const finalAttachments = [...parsedExistingAttachments, ...newAttachments];

    // ==========================
    // Update Data
    // ==========================

    const updateData = {
      updateStatus: true,
    };

    if (typeof content === "string") {
      updateData.content = content.trim();
    }

    updateData.attachments = finalAttachments;

    const updatedNote = await credentialNote.findByIdAndUpdate(
      noteId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      status: "success",
      message: "Note updated successfully",
      data: updatedNote,
    });
  } catch (error) {
    console.error("updateNote error:", error);

    uploadedFiles.forEach((filePath) => cleanupLocalFile(filePath));

    return res.status(500).json({
      status: "failed",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
