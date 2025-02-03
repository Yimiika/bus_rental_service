module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      trip_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.ENUM("Cash", "Card", "Transfer"),
        allowNull: false,
      },
      payment_status: {
        type: DataTypes.ENUM("Pending", "Completed"),
        defaultValue: "Pending",
      },
      owner_status: {
        type: DataTypes.ENUM("Pending", "Completed"),
        defaultValue: "Pending",
      },
      refund_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "Payments",
      timestamps: false,
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.Trip, { foreignKey: "trip_id" });
  };

  return Payment;
};
