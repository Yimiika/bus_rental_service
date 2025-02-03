module.exports = (sequelize, DataTypes) => {
  const Bus = sequelize.define(
    "Bus",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      vehicle_registration_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      bus_capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      price_per_day: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      commission: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      vehicle_type: {
        type: DataTypes.ENUM("Luxury Van", "Basic Coaster"),
        allowNull: false,
      },
      verification_status: {
        type: DataTypes.ENUM("Verified", "Not Verified"),
        defaultValue: "Not Verified",
      },
      owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Owners",
          key: "id",
        },
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "Buses",
      timestamps: false,
    }
  );

  return Bus;
};
