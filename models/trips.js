module.exports = (sequelize, DataTypes) => {
  const Trip = sequelize.define(
    "Trip",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      trip_status: {
        type: DataTypes.ENUM("Completed", "Ongoing", "Cancelled"),
        defaultValue: "Ongoing",
      },
      trip_distance: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      start_latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      end_longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      end_latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      bus_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Buses",
          key: "id",
        },
      },
    },
    {
      tableName: "Trips",
      timestamps: true,
    }
  );

  return Trip;
};
