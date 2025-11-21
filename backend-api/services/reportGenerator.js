const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ========================================
// Generate Detailed Plant Health Report PDF
// ========================================
async function generateDetailedReport(analysis, user) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const reportsDir = process.env.REPORTS_DIR || './reports';
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `report-${analysis._id}-${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const writeStream = fs.createWriteStream(filepath);

      doc.pipe(writeStream);

      // ========================================
      // HEADER
      // ========================================
      doc
        .fontSize(28)
        .fillColor('#4CAF50')
        .text('Plant Health Diagnosis Report', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .fillColor('#666')
        .text('AI-Powered Plant Care Analysis', { align: 'center' })
        .moveDown(2);

      // Horizontal line
      doc
        .strokeColor('#4CAF50')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(1.5);

      // ========================================
      // REPORT METADATA
      // ========================================
      doc.fontSize(10).fillColor('#333');

      addKeyValue(doc, 'Report ID:', analysis._id.toString());
      addKeyValue(doc, 'Generated For:', user.name);
      addKeyValue(
        doc,
        'Date:',
        new Date(analysis.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
      addKeyValue(
        doc,
        'Time:',
        new Date(analysis.createdAt).toLocaleTimeString('en-IN')
      );

      doc.moveDown(1.5);

      // ========================================
      // PLANT IMAGE
      // ========================================
      if (analysis.imageUrl) {
        try {
          const imagePath = path.join(
            __dirname,
            '..',
            analysis.imageUrl.replace('/uploads/', 'uploads/')
          );
          if (fs.existsSync(imagePath)) {
            doc
              .fontSize(14)
              .fillColor('#4CAF50')
              .text('Plant Image', { underline: true })
              .moveDown(0.5);

            doc.image(imagePath, {
              fit: [400, 300],
              align: 'center',
            });
            doc.moveDown(1.5);
          }
        } catch (error) {
          console.error('Failed to add image to PDF:', error);
        }
      }

      // ========================================
      // DIAGNOSIS SECTION
      // ========================================
      addSectionHeader(doc, 'Diagnosis');

      doc
        .fontSize(18)
        .fillColor('#F44336')
        .text(analysis.diagnosis || 'Unknown Disease', { bold: true })
        .moveDown(0.5);

      addKeyValue(
        doc,
        'Confidence Level:',
        `${((analysis.confidence || 0) * 100).toFixed(1)}%`
      );
      if (analysis.severity) {
        addKeyValue(doc, 'Severity:', analysis.severity);
      }

      doc.moveDown(1);

      // ========================================
      // PLANT INFORMATION
      // ========================================
      if (analysis.plantSpecies || analysis.scientificName || analysis.family) {
        addSectionHeader(doc, 'Plant Information');

        if (analysis.plantSpecies) {
          addKeyValue(doc, 'Species:', analysis.plantSpecies);
        }
        if (analysis.scientificName) {
          addKeyValue(doc, 'Scientific Name:', analysis.scientificName);
        }
        if (analysis.family) {
          addKeyValue(doc, 'Family:', analysis.family);
        }

        doc.moveDown(1);
      }

      // ========================================
      // SYMPTOMS
      // ========================================
      if (analysis.symptoms && analysis.symptoms.length > 0) {
        addSectionHeader(doc, 'Identified Symptoms');

        analysis.symptoms.forEach((symptom, index) => {
          doc
            .fontSize(10)
            .fillColor('#333')
            .text(`${index + 1}. ${symptom}`, { indent: 20 })
            .moveDown(0.3);
        });

        doc.moveDown(1);
      }

      // ========================================
      // TREATMENT PLAN
      // ========================================
      if (analysis.treatmentPlan) {
        addSectionHeader(doc, 'Treatment Plan');

        if (analysis.treatmentPlan.immediate) {
          doc
            .fontSize(12)
            .fillColor('#F44336')
            .text('Immediate Action Required:', { bold: true })
            .moveDown(0.3);

          analysis.treatmentPlan.immediate.forEach((step, index) => {
            doc
              .fontSize(10)
              .fillColor('#333')
              .text(`${index + 1}. ${step}`, { indent: 20 })
              .moveDown(0.3);
          });

          doc.moveDown(0.5);
        }

        if (analysis.treatmentPlan.shortTerm) {
          doc
            .fontSize(12)
            .fillColor('#FF9800')
            .text('Short-term Care (1-2 weeks):', { bold: true })
            .moveDown(0.3);

          analysis.treatmentPlan.shortTerm.forEach((step, index) => {
            doc
              .fontSize(10)
              .fillColor('#333')
              .text(`${index + 1}. ${step}`, { indent: 20 })
              .moveDown(0.3);
          });

          doc.moveDown(0.5);
        }

        if (analysis.treatmentPlan.longTerm) {
          doc
            .fontSize(12)
            .fillColor('#4CAF50')
            .text('Long-term Maintenance:', { bold: true })
            .moveDown(0.3);

          analysis.treatmentPlan.longTerm.forEach((step, index) => {
            doc
              .fontSize(10)
              .fillColor('#333')
              .text(`${index + 1}. ${step}`, { indent: 20 })
              .moveDown(0.3);
          });
        }

        doc.moveDown(1);
      }

      // ========================================
      // ORGANIC REMEDIES
      // ========================================
      if (analysis.organicRemedies && analysis.organicRemedies.length > 0) {
        addSectionHeader(doc, 'Organic Remedies');

        analysis.organicRemedies.forEach((remedy, index) => {
          doc
            .fontSize(11)
            .fillColor('#9C27B0')
            .text(`${index + 1}. ${remedy.name}`, { bold: true })
            .moveDown(0.3);

          doc
            .fontSize(10)
            .fillColor('#333')
            .text(remedy.description, { indent: 20 })
            .moveDown(0.3);

          if (remedy.howToUse) {
            doc
              .fontSize(9)
              .fillColor('#666')
              .text(`How to use: ${remedy.howToUse}`, {
                indent: 20,
                italics: true,
              })
              .moveDown(0.5);
          }
        });

        doc.moveDown(1);
      }

      // ========================================
      // PREVENTION TIPS
      // ========================================
      if (analysis.preventionTips && analysis.preventionTips.length > 0) {
        addSectionHeader(doc, 'Prevention Tips');

        analysis.preventionTips.forEach((tip, index) => {
          doc
            .fontSize(10)
            .fillColor('#333')
            .text(`✓ ${tip}`, { indent: 20 })
            .moveDown(0.3);
        });

        doc.moveDown(1);
      }

      // ========================================
      // FOOTER
      // ========================================
      doc.moveDown(2);
      doc
        .fontSize(8)
        .fillColor('#999')
        .text(
          'This report is generated by AI and should be used as a guide. For critical plant health issues, please consult a certified agronomist.',
          { align: 'center' }
        )
        .moveDown(0.5);

      doc
        .fontSize(8)
        .fillColor('#666')
        .text('Plant Health Diagnosis Tool © 2025', { align: 'center' })
        .text('For support: support@planthelp.com', { align: 'center' });

      // Finalize PDF
      doc.end();

      writeStream.on('finish', () => {
        resolve(filepath);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// ========================================
// HELPER FUNCTIONS
// ========================================
function addSectionHeader(doc, title) {
  doc
    .fontSize(14)
    .fillColor('#4CAF50')
    .text(title, { underline: true })
    .moveDown(0.5);
}

function addKeyValue(doc, key, value) {
  const yPos = doc.y;
  doc.fontSize(10).fillColor('#666').text(key, 50, yPos, { continued: true });

  doc.fontSize(10).fillColor('#333').text(` ${value}`, { continued: false });

  doc.moveDown(0.3);
}

module.exports = {
  generateDetailedReport,
};
