import jwt from "jsonwebtoken";

// Modified generateToken to work with both traditional and Google login
export const generateToken = (res, user, message) => {

  // --- START OF CHANGE ---

  // 1. Create a payload that includes the user's ID and role.
  const payload = {
    userId: user._id,
    role: user.role // This is the essential addition!
  };

  // 2. Sign the new, more informative payload.
  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });

  // --- END OF CHANGE ---

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,      // Protects against XSS attacks
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: "strict",    // Protects against CSRF attacks ('None' for cross-site API, but strict is safer)
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }).json({
      success: true,
      message,
      // SECURITY NOTE: Avoid sending the full user object back, especially the password.
      // Send a sanitized version instead.
      user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          photoUrl: user.photoUrl
      },
      token: token
    });
};

// This function now works perfectly with the updated generateToken
export const handleGoogleAuthSuccess = (req, res) => {
  // req.user contains the authenticated user from Google OAuth
  const user = req.user;

  // Use your existing token generation function
  return generateToken(res, user, "Successfully logged in with Google");
};