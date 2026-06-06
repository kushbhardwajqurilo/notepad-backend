
// const crypto = require("crypto");

const SessionModel = require("../model/sessionModel");
 



// Create a new session
exports.createSession = async (username, userId) => {
  try {
    const newSession = await SessionModel.create({ username, userId });

    return newSession;
  } catch (error) {
    console.log(error);
  }
};

exports.deleteSession = async (sessionId) => {
  try {
    const deletedSession = await SessionModel.findByIdAndDelete(sessionId);
    return deletedSession;
  } catch (error) {
    console.log(error);
  }
}
// Validate a session
exports.findSession = async (sessionId) => {
 
  try {
    const session = await SessionModel.findById(sessionId);
    return session;
  } catch (error) {
    console.log(error);
  }
};
