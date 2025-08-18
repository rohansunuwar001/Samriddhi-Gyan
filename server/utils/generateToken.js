import jwt from "jsonwebtoken";

// Modified generateToken to work with both traditional and Google login
export const generateToken = (res, user, message) => {
  const payload = {
    userId: user._id,
    role: user.role 
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });

  

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,      
      secure: process.env.NODE_ENV === 'production', 
      sameSite: "strict",  
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }).json({
      success: true,
      message,
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