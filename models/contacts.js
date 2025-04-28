module.exports = (sequelize, DataTypes) => {
  const Contact = sequelize.define("Contact", {
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    subject: {
      type: DataTypes.ENUM("general enquiry", "support", "feedback"),
      allowNull: false
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: "Contacts",
    timestamps: true
  });
  return Contact
}