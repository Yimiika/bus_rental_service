module.exports = (sequelize, DataTypes) => {
  const TripBuses = sequelize.define(
    "TripBuses",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      trip_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Trips",
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
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "TripBuses",
      timestamps: false,
    }
  );
  return TripBuses;
};
