const mongoose = require("mongoose");
const { mainDbConnection, mainDb } = require("../config/normaldb");
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

const draftSchema = mongoose.Schema(
  {
    title: { type: String },
    isDrafy: { type: Boolean },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "notes",
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String },
    draftId: { type: String },
    attachments: [attachmentSchema],
  },
  {
    timestamps: true,
  },
);

const draftModel = connection1.model("Draft", draftSchema);
module.exports = draftModel;
