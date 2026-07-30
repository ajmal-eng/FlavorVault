const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Order = require("../models/Order");
const nodemailer = require("nodemailer");

function generateReferralCode(name){
  const b=(name||"USER").replace(/[^A-Za-z]/g,"").toUpperCase().slice(0,5)||"USER";
  const r=Math.floor(1000+Math.random()*9000);
  const y=new Date().getFullYear();
  return `${b}${y}-${r}`;
}

// Set EMAIL_USER and EMAIL_PASS in your .env file (a Gmail address + an
// "App Password", not your normal Gmail password - generate one at
// https://myaccount.google.com/apppasswords) for this to actually send mail.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Some networks (school/college-managed devices, certain antivirus
  // software) intercept HTTPS/SMTP connections and re-sign them with
  // their own certificate, which Node doesn't trust by default and causes
  // "self-signed certificate in certificate chain" errors. This disables
  // certificate verification for this connection only, which is fine for
  // local development but should NOT be used in a real production deployment.
  tls: {
    rejectUnauthorized: false
  }
});

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email" });
    }
    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Admin accounts cannot be reset here. Contact system administrator." });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.resetCode = code;
    user.resetCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your FlavorVault password reset code",
        text: `Your password reset code is ${code}. It expires in 5 minutes.`
      });
    } catch (mailError) {
      console.error("EMAIL SEND ERROR:", mailError.message);
      return res.status(500).json({ success: false, message: "Could not send reset email. Check backend EMAIL_USER/EMAIL_PASS configuration." });
    }

    res.json({ success: true, message: "Reset code sent to your email" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.resetCode) {
      return res.status(400).json({ success: false, message: "No reset request found. Please request a new code." });
    }
    if (!user.resetCodeExpires || Date.now() > new Date(user.resetCodeExpires).getTime()) {
      return res.status(400).json({ success: false, message: "Code expired. Please request a new one." });
    }
    if (user.resetCode !== code) {
      return res.status(400).json({ success: false, message: "Incorrect code. Please try again." });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetCode) {
      return res.status(400).json({ success: false, message: "No reset request found. Please request a new code." });
    }
    if (!user.resetCodeExpires || Date.now() > new Date(user.resetCodeExpires).getTime()) {
      return res.status(400).json({ success: false, message: "Code expired. Please request a new one." });
    }
    if (user.resetCode !== code) {
      return res.status(400).json({ success: false, message: "Incorrect code. Please try again." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const registerUser = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { name, username, email, password, phone, address } = req.body;

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    if (username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({
          message: "That username is already taken"
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username: username || undefined,
      email,
      password: hashedPassword,
      phone,
      address
    });

    console.log("User saved successfully");

    res.status(201).json({
      message: "User registered successfully",
      user
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, username, identifier, password } = req.body;
    // Accept whichever field the frontend sends - email, username, or a
    // generic "identifier" that could be either.
    const loginValue = identifier || email || username;

    if (!loginValue) {
      return res.status(400).json({
        message: "Please enter your email or username"
      });
    }

    const user = await User.findOne({
      $or: [{ email: loginValue }, { username: loginValue }]
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email/username or password"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email/username or password"
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username || "",
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role || "user"
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const Coupon = require('../models/Coupon');

const REWARD_CATALOG = [
  {
    id: "r5",
    name: "$5 Coupon",
    points: 5,
    icon: "fa-ticket-alt",
    color: "var(--accent)",
    repeatIntervalDays: 1,
    coupon: { type: 'fixed', amount: 5 }
  },
  {
    id: "drink",
    name: "Free Drink",
    points: 12,
    icon: "fa-glass-whiskey",
    color: "var(--green)",
    repeatIntervalDays: 7,
    coupon: { type: 'fixed', amount: 5.5 }
  },
  {
    id: "burger",
    name: "Free Burger",
    points: 25,
    icon: "fa-hamburger",
    color: "#f59e0b",
    repeatIntervalDays: 30,
    coupon: { type: 'fixed', amount: 22 }
  },
  {
    id: "vip",
    name: "VIP Membership",
    points: 50,
    icon: "fa-crown",
    color: "#9333ea",
    repeatIntervalDays: 30,
    coupon: { type: 'fixed', amount: 20 }
  }
];

const getUserPoints = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email points referralCode redeemedRewards");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const redeemReward = async (req, res) => {
  try {
    const { userId, rewardId } = req.body;
    const reward = REWARD_CATALOG.find(r => r.id === rewardId);
    if (!reward) return res.status(404).json({ success: false, message: "Reward not found" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const userRedeemed = (user.redeemedRewards || [])
      .filter(rr => rr.rewardId === rewardId)
      .sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
    const lastRedeemed = userRedeemed[0] || null;

    if (lastRedeemed && reward.repeatIntervalDays) {
      const nextAvailable = new Date(lastRedeemed.redeemedAt);
      nextAvailable.setDate(nextAvailable.getDate() + reward.repeatIntervalDays);
      if (Date.now() < nextAvailable.getTime()) {
        return res.status(400).json({
          success: false,
          message: `Reward already redeemed. Next available on ${nextAvailable.toLocaleDateString()}.`
        });
      }
    } else if (lastRedeemed && !reward.repeatIntervalDays) {
      return res.status(400).json({ success: false, message: "Reward already redeemed." });
    }

    if ((user.points || 0) < reward.points) {
      return res.status(400).json({ success: false, message: `Not enough points. You need ${reward.points - user.points} more.` });
    }

    user.points = (user.points || 0) - reward.points;
    user.redeemedRewards = user.redeemedRewards || [];
    user.redeemedRewards.push({ rewardId: reward.id, rewardName: reward.name, pointsCost: reward.points, redeemedAt: new Date() });
    await user.save();
    let couponCode = null;

    if (reward.coupon) {
      couponCode = `REWARD-${reward.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      try {
        await Coupon.findOneAndUpdate(
          { code: couponCode },
          { $set: { type: reward.coupon.type, amount: reward.coupon.amount || 0, discount: reward.coupon.discount || 0, active: true } },
          { upsert: true, returnDocument: 'after' }
        );
      } catch (e) {
        console.error('Coupon create/update error:', e.message);
      }
    }

    res.json({ success: true, message: `Successfully redeemed: ${reward.name}`, points: user.points, couponCode });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getRewardCatalog = async (req, res) => {
  res.json({ success: true, rewards: REWARD_CATALOG });
};

const getRecommendations = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(50);
    const freq = {};
    const pair = {};
    orders.forEach(o => {
      const n = (o.items || []).map(i => i.name);
      n.forEach(name => { freq[name] = (freq[name] || 0) + 1; if (!pair[name]) pair[name] = {}; });
      n.forEach((a, idx) => { n.forEach((b, jdx) => { if (idx !== jdx) pair[a][b] = (pair[a][b] || 0) + 1; }); });
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([n]) => n);
    const recs = [];
    if (sorted.length > 0) {
      const top = sorted[0];
      recs.push(top);
      const pm = pair[top] || {};
      const p = Object.entries(pm).sort((a, b) => b[1] - a[1]).map(([n]) => n);
      if (p[0]) recs.push(p[0]);
      if (p[1]) recs.push(p[1]);
    }
    res.json({ success: true, recommendations: recs, basedOnOrders: orders.length });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// NOTE: dev helper for setting user points has been removed for safety.

module.exports = {
  registerUser, loginUser, getUserPoints,
  redeemReward, getRewardCatalog, getRecommendations,
  forgotPassword, verifyResetCode, resetPassword,
  // setUserPoints removed
};
