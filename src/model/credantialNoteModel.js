const mongoose = require("mongoose");
const connection1 = require("../config/mongo1");
const attachmentSchema = mongoose.Schema(
  {
    public_id: String,
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    resource_type: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }, // Don't create _id for subdocuments
);
const credentialNoteSchema = mongoose.Schema(
  {
    // title: { type: String },
    content: { type: String },
    userId: { type: mongoose.SchemaTypes.ObjectId },
    updateStatus: { type: Boolean },
    attachments: [attachmentSchema],
  },
  {
    timestamps: true,
  },
);
const credentialNote = connection1.model(
  "credentialnote",
  credentialNoteSchema,
);
module.exports = credentialNote;
