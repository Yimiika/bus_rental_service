const validateContact = (req, res, next) => {
  const { first_name, last_name, email, subject, message_text } = req.body;

  // Check all fields exist
  if (!first_name || !last_name || !email || !subject || !message_text) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // Simple email validation
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  // Validate subject is one of the allowed values
  const validSubjects = ["general enquiry", "support", "feedback"];
  if (!validSubjects.includes(subject.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid subject. Must be one of: general enquiry, support request, feedback",
    });
  }

  // Validate message length
  if (message_text.length < 10 || message_text.length > 2000) {
    return res.status(400).json({
      success: false,
      message: "Message must be between 10 and 2000 characters",
    });
  }

  next();
};

module.exports = validateContact;
