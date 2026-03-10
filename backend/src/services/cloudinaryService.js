const cloudinary = require('cloudinary').v2;

// Verify Env Variables exist!
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("❌ CRITICAL: Cloudinary environment variables are missing!");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (base64Image) => {
    try {
        // Cloudinary expects the raw string without the data URI prefix if it's acting up, 
        // but usually handles the full data URI. We'll use the full URI for safety.
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'codescript/problems',
            resource_type: "auto" // Automatically detect if it's a png, jpg, etc.
        });
        
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error("❌ Cloudinary SDK Error:", error);
        throw new Error(error.message || "Cloudinary rejected the upload.");
    }
};

const deleteImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("❌ Cloudinary SDK Error:", error);
        throw new Error("Failed to delete image from Cloudinary");
    }
};

module.exports = { uploadImage, deleteImage };