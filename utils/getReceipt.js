const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const getReceipt = async (tripPayment, userPayment, bus, busPayment) => {
  const fileName = `receipt_${trip.id}.pdf`;
  const filePath = path.join(__dirname, "../receipts", fileName);
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("Bus Rental Receipt", { align: "center" });
  doc.moveDown();

  doc
    .fontSize(14)
    .text(`Customer Name: ${userPayment.first_name} ${userPayment.last_name}`);
  doc.text(`Bus Type: ${bus.vehicle_type}`);
  doc.text(`Booking Type: ${tripPayment.booking_type || "N/A"}`);
  doc.text(`Duration: ${tripPayment.duration || "N/A"}`);
  doc.text(
    `Pickup Date: ${
      tripPayment.pickup_date
        ? new Date(tripPayment.pickup_date).toDateString()
        : new Date(tripPayment.created_at).toDateString()
    }`
  );
  doc.text(`Total Amount: ₦${busPayment.amount}`);
  doc.text(`Payment Method: ${busPayment.payment_method}`);
  doc.text(`Payment Status: ${busPayment.payment_status}`);
  doc.text(`Receipt Date: ${new Date(busPayment.created_at).toLocaleString()}`);

  doc.end();

  return filePath;
};

module.exports = getReceipt;
