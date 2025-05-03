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
        type: DataTypes.STRING(8),
        allowNull: false,
        unique: true,
      },
      vehicle_identification_number: {
        type: DataTypes.STRING(17),
        allowNull: false,
        unique: true,
      },
      bus_capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      price_per_day: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // commission: {
      //   type: DataTypes.FLOAT,
      //   allowNull: false,
      // },
      vehicle_type: {
        type: DataTypes.ENUM("Luxury Van", "Basic Coaster"),
        allowNull: false,
      },
      verification_status: {
        type: DataTypes.ENUM("Verified", "Not Verified"),
        allowNull: false,
        defaultValue: "Not Verified",
      },
      owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "OwnerDetails",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "Buses",
      timestamps: true,
    }
  );

  return Bus;
};
