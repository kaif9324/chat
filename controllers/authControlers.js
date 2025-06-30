const userSchema = require("../module/userSchema");
const { jwtMiddleware, genToken } = require("../middleware/jwt");


exports.register = async (req, resp) => {
  try {
    const data = req.body;
    const newData = new userSchema(data);
    const response = await newData.save();
    const payload = {
      id: response.id,
      email: response.email,
    };

    const token = genToken(payload);
 
    resp.status(200).json({ response: response, token: token });
  } catch (err) {
    resp.status(500).json({ error: "internel server error" });
    console.log(err);
  }
};
exports.login = async (req, resp) => {
  const { email, password } = req.body;
  try {
    const user = await userSchema.findOne({ email: email });
    if (!user)
      return resp.status(404).json({ field: "email", msg: "incorrect email" });
    if (!(await user.comparePassword(password))) {
      return resp
        .status(401)
        .json({ field: "password", msg: "invalid password" });
    }

    const payload = {
      username: user.username,
      id: user.id,
      email: user.email,
    };
    const token = genToken(payload);
 
    resp.status(200).json({ token });
  } catch (err) {
    console.log(err);
    resp.status(500).json("internel server error");
  }
};

exports.Userlist = async (req, resp) => {
  try {
    const userlist = await userSchema.find();
    console.log(userlist);
    resp.json(userlist);
  } catch (error) {
    console.log(error);
    resp.status(500).json("internel server error");
  }
};

// online or offline status route
exports.userstatus = async (req, resp) => {
  try {
    const userId = req.params.userid;
    const ursStatus = await userSchema.findById(userId);

    if (!ursStatus) return resp.status(404).json({ error: "user not found" });
    resp.json({
      online: ursStatus.online,
      lastSeen: ursStatus.lastSeen,
    });
  } catch (err) {
    console.log(err);
    resp.status(500).json("internel server error");
  }
};
