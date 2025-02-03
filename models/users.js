module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      last_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      first_name: {
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
      phone_number: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      total_rating: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      number_of_ratings: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "Users",
      timestamps: false,
    }
  );

  return User;
};
