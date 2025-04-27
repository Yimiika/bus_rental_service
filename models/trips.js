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
      // trip_distance: {
      //   type: DataTypes.FLOAT,
      //   allowNull: false,
      // },
      // start_longitude: {
      //   type: DataTypes.FLOAT,
      //   allowNull: false,
      // },
      // start_latitude: {
      //   type: DataTypes.FLOAT,
      //   allowNull: false,
      // },
      // end_longitude: {
      //   type: DataTypes.FLOAT,
      //   allowNull: false,
      // },
      // end_latitude: {
      //   type: DataTypes.FLOAT,
      //   allowNull: false,
      // },
      pickup_address: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      destination_address: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      rental_purpose: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
      // bus_id: {
      //   type: DataTypes.INTEGER,
      //   allowNull: false,
      //   references: {
      //     model: "Buses",
      //     key: "id",
      //   },
      // },
      // booking_type: {
      //   type: DataTypes.ENUM("Company", "Personal"),
      //   allowNull: false,
      // },
      // duration: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      // },
      // pickup_date: {
      //   type: DataTypes.DATEONLY,
      //   allowNull: false,
      // },
    },
    {
      tableName: "Trips",
      timestamps: true,
    }
  );

  return Trip;
};
