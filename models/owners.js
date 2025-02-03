module.exports = (sequelize, DataTypes) => {
  const Owner = sequelize.define(
    "Owner",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      first_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      email_address: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      designation: {
        type: DataTypes.ENUM("Company", "Individual"),
        allowNull: false,
      },
      verification_status: {
        type: DataTypes.ENUM("Verified", "Not Verified"),
        defaultValue: "Not Verified",
      },
      number_of_ratings: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_rating: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "Owners",
      timestamps: false,
    }
  );

  return Owner;
};
