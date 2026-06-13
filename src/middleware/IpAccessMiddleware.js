const globalIpModel = require("../model/globalIPBlockModel");
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

    const globalIpCheck = await globalIpModel.findOne({}, "isGlobalBlocked");
    if (globalIpCheck && globalIpCheck?.isGlobalBlocked) {
      return res.status(403).json({
        status: "failed",
        message: "Access Denied Please Contact Admin",
      });
    }

    const ipAvailable = await IpBlockModel.findOne({
      ip,
    });
    console.log("block ip", ipAvailable);
    // if (ipAvailable === null) {
    //   return res.status(403).json({
    //     status: "failed",
    //     message: "Access Denied Please Contact Admin",
    //   });
    // }
    if (!ipAvailable) {
      return res.status(403).json({
        status: "failed",
        message: "Access Denied Please Contact Admin",
      });
    }
    if (ipAvailable && ipAvailable.isActive === true) {
      next();
    }
    if (ipAvailable && ipAvailable.isActive === false) {
      return res.status(403).json({
        status: "failed",
        message: "Access Denied Please Contact Admin",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: "Something Went Wrong",
    });
  }
};
