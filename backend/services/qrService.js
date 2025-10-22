const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Generates a unique check-in ID and a corresponding QR code data URL for an event.
 * @param {import('mongoose').Document} event - The event document.
 * @returns {Promise<{checkInId: string, checkInQRCode: string}>}
 */
const generateEventQRCode = async (event) => {
  // Generate a new unique ID for check-in if it doesn't exist
  const checkInId = event.checkInId || uuidv4();

  // The URL encoded in the QR code. This will be scanned by the student app,
  // which will parse the ID from it. It uses an environment variable for flexibility.
  const studentAppBaseUrl = process.env.STUDENT_APP_BASE_URL || 'http://localhost:8081';
  const checkInUrl = `${studentAppBaseUrl}/check-in?id=${checkInId}`;

  // Generate the QR code as a Data URL
  const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
  });

  return { checkInId, checkInQRCode: qrCodeDataUrl };
};

module.exports = { generateEventQRCode };