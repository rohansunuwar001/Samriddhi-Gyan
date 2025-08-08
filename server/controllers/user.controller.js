import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
import { generateToken } from "../utils/generateToken.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body; //
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to register",
    });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    generateToken(res, user, `Welcome back ${user.name}`);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};
export const logout = async (_, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
};
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("enrolledCourses");
    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user",
    });
  }
};
export const checkUser = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("enrolledCourses");
    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }
    generateToken(res, user, `Welcome back ${user.name}`);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user",
    });
  }
};

export const updateUserInfo = async (req, res) => {
  try {
    const userId = req.id;
    // Destructure the main fields and the entire 'links' object from the body
    const { name, headline, description, links } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build an object with only the fields that are provided in the request
    const updateData = {};
    if (name) updateData.name = name;
    if (headline) updateData.headline = headline;
    if (description) updateData.description = description;

    // --- NEW: Logic to handle the nested 'links' object ---
    if (links && typeof links === "object") {
      // Use dot notation to specify fields within the nested object for update
      if (links.website !== undefined)
        updateData["links.website"] = links.website;
      if (links.facebook !== undefined)
        updateData["links.facebook"] = links.facebook;
      if (links.instagram !== undefined)
        updateData["links.instagram"] = links.instagram;
    if (links.twitter !== undefined)
        updateData["links.twitter"] = links.twitter;
    if (links.linkedin !== undefined)
        updateData["links.linkedin"] = links.linkedin;
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No update information provided." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData }, // Use $set to update only the specified fields
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Profile information updated successfully.",
    });
  } catch (error) {
    console.error("Error updating user info:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating profile information.",
    });
  }
};

export const updateUserAvatar = async (req, res) => {
  try {
    const userId = req.id;
    const profilePhoto = req.file; // From multer middleware

    if (!profilePhoto) {
      return res.status(400).json({ message: "No image file provided." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Delete the old avatar from Cloudinary if it exists
    if (user.photoUrl) {
      try {
        // Extracts the public_id from a URL like: http://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg
        const publicId = user.photoUrl.split("/").pop().split(".")[0];
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        // Log the error but don't block the upload of the new avatar
        console.error(
          "Failed to delete old avatar, continuing with upload:",
          deleteError
        );
      }
    }

    // 2. Upload the new avatar to Cloudinary
    const cloudResponse = await uploadMedia(profilePhoto.path);
    const newPhotoUrl = cloudResponse.secure_url;

    // 3. Update the user document with the new photo URL
    user.photoUrl = newPhotoUrl;
    await user.save();

    return res.status(200).json({
      success: true,
      photoUrl: newPhotoUrl,
      message: "Avatar updated successfully.",
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating avatar.",
    });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const userId = req.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide both current and new passwords." });
    }

    // Find the user but explicitly include the password field
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If the user signed up via Google, they don't have a local password to change
    if (!user.password) {
      return res
        .status(400)
        .json({
          message:
            "Password cannot be changed for Google-authenticated accounts.",
        });
    }

    // 1. Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password." });
    }

    // 2. Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // 3. Save the user with the new password
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating password.",
    });
  }
};
