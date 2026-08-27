// Simple shared-PIN login for the kitchen/chef screen. This app doesn't use
// per-account auth for the kitchen (it's a single shared device in the
// kitchen), so this just checks the PIN against a value configured on the
// server and hands back a token the frontend stores in localStorage - it
// mirrors the same pattern already used by the admin/user login flows in
// this codebase (no server-side session or JWT verification elsewhere
// either).
const loginChef = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ success: false, message: "PIN is required" });
    }

    // Falls back to a default PIN if CHEF_PIN isn't set, so the kitchen
    // screen isn't permanently locked out of the box - but for a real
    // deployment, set CHEF_PIN in the environment so the default isn't
    // publicly guessable.
    const correctPin = process.env.CHEF_PIN || "1234";

    if (String(pin).trim() !== String(correctPin).trim()) {
      return res.status(400).json({ success: false, message: "Incorrect PIN" });
    }

    res.json({
      success: true,
      token: `chef-${Date.now()}-${Math.random().toString(36).slice(2)}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { loginChef };
