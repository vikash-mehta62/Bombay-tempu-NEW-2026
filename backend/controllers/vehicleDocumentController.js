const Vehicle = require('../models/Vehicle');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const archiver = require('archiver');
const path = require('path');

const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'png';
  }

  return null;
};

/**
 * @desc    Generate PDF with all vehicle documents
 * @route   GET /api/vehicles/:id/download-documents-pdf
 * @access  Private
 */
exports.downloadAllDocumentsPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicle = await Vehicle.findById(id)
      .populate('fleetOwnerId', 'fullName contact')
      .populate('defaultDriverId', 'fullName contact');
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Collect all documents that exist
    const documentList = [
      { title: 'Registration Certificate', doc: vehicle.registrationDocument, date: vehicle.registrationDate },
      { title: 'Registration Certificate (Front)', doc: vehicle.registrationDocumentFront, date: null },
      { title: 'Registration Certificate (Back)', doc: vehicle.registrationDocumentBack, date: null },
      { title: 'Fitness Certificate', doc: vehicle.fitnessDocument, date: vehicle.fitnessExpiryDate },
      { title: 'Insurance Document', doc: vehicle.insuranceDocument, date: vehicle.insuranceExpiryDate },
      { title: 'PUC Certificate', doc: vehicle.pucDocument, date: vehicle.pucExpiryDate },
      { title: 'Permit Document', doc: vehicle.permitDocument, date: vehicle.permitExpiryDate },
      { title: 'National Permit', doc: vehicle.nationalPermitDocument, date: vehicle.nationalPermitExpiryDate },
      { title: 'Tax Document', doc: vehicle.taxDocument, date: vehicle.taxValidUptoDate },
      { title: 'Aadhar Card (Front)', doc: vehicle.aadharCardFront, date: null },
      { title: 'Aadhar Card (Back)', doc: vehicle.aadharCardBack, date: null },
      { title: 'PAN Card', doc: vehicle.panCard, date: null },
      { title: 'TDS Form', doc: vehicle.tdsForm, date: null }
    ];

    console.log('Starting PDF generation for vehicle:', vehicle.vehicleNumber);

    // Download and validate all images first
    const validDocuments = [];
    
    for (const item of documentList) {
      // Check if document exists and has a valid URL
      if (!item.doc || !item.doc.url || item.doc.url.trim() === '') {
        continue;
      }

      try {
        console.log(`Downloading: ${item.title}`);
        
        // Try to download the image
        const response = await axios.get(item.doc.url, {
          responseType: 'arraybuffer',
          timeout: 15000,
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          }
        });

        const imageBuffer = Buffer.from(response.data);
        
        // Only add if image was successfully downloaded and has content
        if (imageBuffer.length > 100) {
          validDocuments.push({
            title: item.title,
            imageBuffer: imageBuffer,
            date: item.date,
            uploadedAt: item.doc.uploadedAt
          });
          console.log(`✓ Loaded: ${item.title} (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
        }
      } catch (imageError) {
        console.error(`✗ Failed: ${item.title} - ${imageError.message}`);
      }
    }

    const renderableDocuments = validDocuments.filter((item) => detectImageType(item.imageBuffer));

    console.log(`Total downloaded docs: ${validDocuments.length}`);
    console.log(`Total renderable image docs: ${renderableDocuments.length}`);

    if (renderableDocuments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No supported image documents found (only JPG/PNG are supported in PDF)'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 30,
      bufferPages: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${vehicle.vehicleNumber}_Documents_${new Date().toISOString().split('T')[0]}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    let pageCount = 0;

    // Add cover page
    doc.fontSize(26)
       .fillColor('#1e40af')
       .text('Vehicle Documents', { align: 'center' });
    
    doc.moveDown(0.8);
    
    doc.fontSize(20)
       .fillColor('#3b82f6')
       .text(vehicle.vehicleNumber, { align: 'center' });
    
    doc.moveDown(1.5);

    doc.fontSize(12)
       .fillColor('#374151');
    
    if (vehicle.vehicleType) {
      doc.text(`Type: ${vehicle.vehicleType.replace('_', ' ').toUpperCase()}`, { align: 'center' });
    }
    
    if (vehicle.brand && vehicle.model) {
      doc.text(`${vehicle.brand} ${vehicle.model}`, { align: 'center' });
    }
    
    if (vehicle.capacityTons) {
      doc.text(`Capacity: ${vehicle.capacityTons} tons`, { align: 'center' });
    }

    doc.moveDown(1);
    
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text(`Generated: ${new Date().toLocaleDateString('en-IN', {
         year: 'numeric',
         month: 'long',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
       })}`, { align: 'center' });

    doc.text(`Total Documents: ${renderableDocuments.length}`, { align: 'center' });

    pageCount++;

    // Add each document on a new page
    for (let i = 0; i < renderableDocuments.length; i++) {
      const item = renderableDocuments[i];
      
      // Add new page
      doc.addPage();
      pageCount++;

      // Document title at top
      doc.fontSize(16)
         .fillColor('#1e40af')
         .text(item.title, 30, 30);
      
      let yPos = 55;

      // Add dates if available
      doc.fontSize(9)
         .fillColor('#666666');
      
      if (item.date) {
        doc.text(`Expiry: ${new Date(item.date).toLocaleDateString('en-IN')}`, 30, yPos);
        yPos += 15;
      }

      if (item.uploadedAt) {
        doc.text(`Uploaded: ${new Date(item.uploadedAt).toLocaleDateString('en-IN')}`, 30, yPos);
        yPos += 20;
      } else {
        yPos += 10;
      }

      // Calculate available space for image
      const pageWidth = doc.page.width - 60; // 30px margin on each side
      const pageHeight = doc.page.height - yPos - 50; // Leave space at bottom
      
      // Add image
      try {
        doc.image(item.imageBuffer, 30, yPos, {
          fit: [pageWidth, pageHeight],
          align: 'center',
          valign: 'top'
        });
      } catch (imgError) {
        console.error(`Error adding image to PDF: ${item.title}`, imgError);
        doc.fontSize(12)
           .fillColor('#ef4444')
           .text('[Image could not be added to PDF]', 30, yPos + 50);
      }
    }

    // Add page numbers to all pages
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - doc.page.margins.bottom - 12;
      
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text(
           `Page ${i + 1} of ${range.count} | ${vehicle.vehicleNumber}`,
           30,
           footerY,
           { 
             align: 'center',
             width: doc.page.width - 60,
             lineBreak: false
           }
         );
    }

    // Finalize PDF
    doc.end();
    console.log(`PDF generated successfully with ${renderableDocuments.length} documents`);

  } catch (error) {
    console.error('PDF generation error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  }
};

/**
 * @desc    Download all vehicle documents as ZIP
 * @route   GET /api/vehicles/:id/download-documents-zip
 * @access  Private
 */
exports.downloadAllDocumentsZIP = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicle = await Vehicle.findById(id)
      .populate('fleetOwnerId', 'fullName contact')
      .populate('defaultDriverId', 'fullName contact');
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Collect all documents that exist
    const documentList = [
      { title: 'Registration_Certificate', doc: vehicle.registrationDocument, date: vehicle.registrationDate },
      { title: 'Registration_Certificate_Front', doc: vehicle.registrationDocumentFront, date: null },
      { title: 'Registration_Certificate_Back', doc: vehicle.registrationDocumentBack, date: null },
      { title: 'Fitness_Certificate', doc: vehicle.fitnessDocument, date: vehicle.fitnessExpiryDate },
      { title: 'Insurance_Document', doc: vehicle.insuranceDocument, date: vehicle.insuranceExpiryDate },
      { title: 'PUC_Certificate', doc: vehicle.pucDocument, date: vehicle.pucExpiryDate },
      { title: 'Permit_Document', doc: vehicle.permitDocument, date: vehicle.permitExpiryDate },
      { title: 'National_Permit', doc: vehicle.nationalPermitDocument, date: vehicle.nationalPermitExpiryDate },
      { title: 'Tax_Document', doc: vehicle.taxDocument, date: vehicle.taxValidUptoDate },
      { title: 'Aadhar_Card_Front', doc: vehicle.aadharCardFront, date: null },
      { title: 'Aadhar_Card_Back', doc: vehicle.aadharCardBack, date: null },
      { title: 'PAN_Card', doc: vehicle.panCard, date: null },
      { title: 'TDS_Form', doc: vehicle.tdsForm, date: null }
    ];

    // Download and validate all images first
    const validDocuments = [];
    
    for (const item of documentList) {
      // Check if document exists and has a valid URL
      if (!item.doc || !item.doc.url || item.doc.url.trim() === '') {
        console.log(`Skipping ${item.title}: No URL found`);
        continue;
      }

      try {
        console.log(`Downloading ${item.title} from ${item.doc.url}`);
        
        // Try to download the image
        const response = await axios.get(item.doc.url, {
          responseType: 'arraybuffer',
          timeout: 15000,
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          }
        });

        const imageBuffer = Buffer.from(response.data);
        
        // Only add if image was successfully downloaded and has content
        if (imageBuffer.length > 100) {
          // Get file extension from URL or content-type
          let extension = '.jpg';
          const urlPath = item.doc.url.split('?')[0];
          const urlExt = path.extname(urlPath);
          if (urlExt) {
            extension = urlExt;
          } else if (response.headers['content-type']) {
            const contentType = response.headers['content-type'];
            if (contentType.includes('png')) extension = '.png';
            else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = '.jpg';
            else if (contentType.includes('pdf')) extension = '.pdf';
          }

          validDocuments.push({
            ...item,
            imageBuffer: imageBuffer,
            extension: extension
          });
          console.log(`✓ Successfully loaded ${item.title} (${imageBuffer.length} bytes)`);
        } else {
          console.log(`✗ Skipping ${item.title}: Image too small (${imageBuffer.length} bytes)`);
        }
      } catch (imageError) {
        console.error(`✗ Failed to load ${item.title}:`, imageError.message);
      }
    }

    console.log(`Total valid documents for ZIP: ${validDocuments.length}`);

    if (validDocuments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid documents found for this vehicle'
      });
    }

    // Set response headers for ZIP
    const zipFilename = `${vehicle.vehicleNumber}_Documents_${new Date().toISOString().split('T')[0]}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add each document to ZIP
    for (let i = 0; i < validDocuments.length; i++) {
      const item = validDocuments[i];
      const filename = `${i + 1}_${item.title}${item.extension}`;
      
      archive.append(item.imageBuffer, { name: filename });
      console.log(`Added to ZIP: ${filename}`);
    }

    // Finalize the archive
    await archive.finalize();
    console.log(`ZIP created successfully with ${validDocuments.length} documents`);

  } catch (error) {
    console.error('ZIP generation error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate ZIP',
        error: error.message
      });
    }
  }
};
