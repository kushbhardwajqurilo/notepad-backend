const IpBlockModel = require("../model/IPModel");

exports.IPAccessMiddleware = async (req, res, next) => {
  try {
    let ip =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.ip ||
      req.socket.remoteAddress;
    console.log("ip", ip);
    ip = ip.replace(/^::ffff:/, "");

    if (ip === "::1") {
      ip = "127.0.0.1";
    }

    const blockedIp = await IpBlockModel.findOne({
      ip,
      isActive: false,
    });

    if (blockedIp) {
      return res.status(403).json({
        status: "failed",
        message: "Access Denied Please Contact Admin",
      });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "Something Went Wrong",
    });
  }
};
