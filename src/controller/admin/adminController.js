const IpBlockModel = require("../../model/IPModel");

exports.addIp = async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip) {
      return res.status(400).json({
        status: "failed",
        message: "IP Missing",
      });
    }

    const ips = Array.isArray(ip) ? ip : [ip];
    const operations = ips.map((ipAddress) => ({
      updateOne: {
        filter: { ip: ipAddress },
        update: {
          $setOnInsert: {
            ip: ipAddress,
          },
        },
        upsert: true,
      },
    }));

    const result = await IpBlockModel.bulkWrite(operations);

    return res.status(200).json({
      status: "success",
      message: "IPs processed successfully",
      insertedCount: result.upsertedCount,
      existingCount: ips.length - result.upsertedCount,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: error.message,
      error,
    });
  }
};
// get all IP's
exports.getAllIP = async (req, res) => {
  try {
    const IPs = await IpBlockModel.find({}).sort({ createdAt: -1 }).lean();
    if (!IPs) {
      return res.status(200).json({
        status: "success",
        message: "no IPs found",
        data: [],
      });
    }
    const filterIP = IPs.map((ip) => ({
      _id: ip?._id,
      ip: ip?.ip,
      isActive: ip?.isActive,
      createdAt: ip?.createdAt,
    }));
    return res.status(200).json({
      status: "success",
      message: "ip fateched",
      data: filterIP,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Something Went Wrong",
      error: error,
    });
  }
};

// delete ip
exports.deleteIP = async (req, res) => {
  try {
    const { id } = req?.params;

    console.log("ip id", id);
    if (!id) {
      return res.status(400).json({
        status: "failed",
        message: "Ip Missing",
      });
    }
    const removeIp = await IpBlockModel.deleteOne({ _id: id });
    if (removeIp.deletedCount === 0) {
      return res
        .status(400)
        .json({ status: "failed", messsage: "Failed to delete IP" });
    }
    return res.status(200).json({
      status: "success",
      message: "IP delete successfull",
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Internal Server Error",
      error: error,
    });
  }
};

// active all ip active
exports.activeDeactiveAllIPs = async (req, res, next) => {
  try {
    const { status } = req?.body;
    const result = await IpBlockModel.updateMany({ isActive: !status });
    if (result.modifiedCount === 0) {
      return res.status(400).json({
        status: "failed",
        message: "failed to active",
      });
    }
    return res.status(201).json({
      status: "success",
      message: status ? "All IP's Blocked" : "All IP's Activated",
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Internal Server Error",
      error: error,
    });
  }
};
exports.IPGlobaleStatus = async (req, res, next) => {
  try {
    const AllIp = await IpBlockModel.find({}, "isActive");
    if (!AllIp) {
      return res.status(201).json({
        status: "success",
        message: "",
        data: { isGlobalBlocked: null },
      });
    }
    const isActive = AllIp.every((val) => val?.isActive === false);
    return res.status(201).json({
      status: "success",
      message: "",
      data: { isGlobalBlocked: isActive },
    });
  } catch (err) {
    return res.status(500).json({
      status: "failed",
      message: "something went wrong",
    });
  }
};

// single ip blocked or unblocked
exports.SingleIPBlockUnblock = async (req, res, next) => {
  try {
    const { id } = req?.params;
    const { isActive } = req?.body;
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "IP Id missing",
      });
    }
    const result = await IpBlockModel.updateOne(
      { _id: id },
      { $set: { isActive: isActive } },
    );
    if (result?.modifiedCount === 0) {
      return res.status(400).json({
        status: "failed",
        message: "Process Failed Try Again",
      });
    }
    return res.status(201).json({
      status: "success",
      message: isActive ? "IP Blocked" : "IP Activated",
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "something went wrong",
    });
  }
};
