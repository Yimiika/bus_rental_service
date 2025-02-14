module.exports = (sequelize, DataTypes) => {
  const OwnerDetails = sequelize.define(
    "OwnerDetails",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      designation: {
        type: DataTypes.ENUM("Company", "Individual"),
        allowNull: false,
      },
      verification_status: {
        type: DataTypes.ENUM("Verified", "Not Verified"),
        allowNull: false,
        defaultValue: "Not Verified",
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "OwnerDetails",
      timestamps: false,
    }
  );

  return OwnerDetails;
};
