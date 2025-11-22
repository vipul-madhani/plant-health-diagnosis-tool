const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  async generateDetailedReport(analysis, user) {
    return new Promise((resolve, reject) => {
      try {
        const reportDir = path.join(__dirname, '../uploads/reports');
        
        // Ensure directory exists
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }

        const filename = `report-${analysis._id}.pdf`;
        const filepath = path.join(reportDir, filename);

        // Create PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        doc
          .fontSize(24)
          .fillColor('#4CAF50')
          .text('AgriIQ', 50, 50)
          .fontSize(10)
          .fillColor('#666')
          .text('Intelligent Plant Health Solutions', 50, 78);

        // Title
        doc
          .moveDown(2)
          .fontSize(20)
          .fillColor('#333')
          .text('Detailed Plant Analysis Report', { align: 'center' });

        doc.moveDown();

        // Report Info Box
        doc
          .fontSize(10)
          .fillColor('#666')
          .text(`Report ID: ${analysis._id}`, { align: 'center' })
          .text(`Generated: ${new Date().toLocaleDateString('en-IN', { 
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}`, { align: 'center' });

        doc.moveDown(2);

        // User Information
        doc
          .fontSize(14)
          .fillColor('#4CAF50')
          .text('User Information');
        
        doc
          .fontSize(10)
          .fillColor('#333')
          .text(`Name: ${user.name}`);
        
        if (user.phone) {
          doc.text(`Phone: ${user.phone}`);
        }
        
        doc.moveDown();

        // Diagnosis Section
        doc
          .fontSize(14)
          .fillColor('#4CAF50')
          .text('Diagnosis');

        doc
          .fontSize(12)
          .fillColor('#333')
          .text(`Disease/Issue: ${analysis.disease || 'Not detected'}`);

        doc
          .fontSize(10)
          .text(`Confidence: ${((analysis.confidence || 0) * 100).toFixed(1)}%`);

        if (analysis.plantSpecies) {
          doc.text(`Plant Species: ${analysis.plantSpecies}`);
        }

        doc.moveDown();

        // Symptoms
        if (analysis.symptoms && analysis.symptoms.length > 0) {
          doc
            .fontSize(14)
            .fillColor('#4CAF50')
            .text('Observed Symptoms');

          doc.fontSize(10).fillColor('#333');
          analysis.symptoms.forEach((symptom, index) => {
            doc.text(`${index + 1}. ${symptom}`);
          });

          doc.moveDown();
        }

        // Treatment Plan
        doc
          .fontSize(14)
          .fillColor('#4CAF50')
          .text('Treatment Plan');

        if (analysis.treatment) {
          // Immediate Actions
          if (analysis.treatment.immediate) {
            doc
              .fontSize(12)
              .fillColor('#333')
              .text('Immediate Actions:', { underline: true });
            
            doc.fontSize(10);
            analysis.treatment.immediate.forEach((action, index) => {
              doc.text(`${index + 1}. ${action}`);
            });
            doc.moveDown(0.5);
          }

          // Short-term (1-2 weeks)
          if (analysis.treatment.shortTerm) {
            doc
              .fontSize(12)
              .fillColor('#333')
              .text('Short-term Treatment (1-2 weeks):', { underline: true });
            
            doc.fontSize(10);
            analysis.treatment.shortTerm.forEach((action, index) => {
              doc.text(`${index + 1}. ${action}`);
            });
            doc.moveDown(0.5);
          }

          // Long-term
          if (analysis.treatment.longTerm) {
            doc
              .fontSize(12)
              .fillColor('#333')
              .text('Long-term Care:', { underline: true });
            
            doc.fontSize(10);
            analysis.treatment.longTerm.forEach((action, index) => {
              doc.text(`${index + 1}. ${action}`);
            });
            doc.moveDown();
          }
        }

        // Organic Remedies
        if (analysis.organicRemedies && analysis.organicRemedies.length > 0) {
          doc
            .fontSize(14)
            .fillColor('#4CAF50')
            .text('Organic Remedies');

          analysis.organicRemedies.forEach((remedy, index) => {
            doc
              .fontSize(11)
              .fillColor('#333')
              .text(`${index + 1}. ${remedy.name}`, { underline: true });
            
            doc
              .fontSize(10)
              .text(`Ingredients: ${remedy.ingredients}`);
            
            doc.text(`Usage: ${remedy.usage}`);
            
            doc.moveDown(0.5);
          });

          doc.moveDown();
        }

        // Prevention Tips
        if (analysis.prevention && analysis.prevention.length > 0) {
          doc
            .fontSize(14)
            .fillColor('#4CAF50')
            .text('Prevention Tips');

          doc.fontSize(10).fillColor('#333');
          analysis.prevention.forEach((tip, index) => {
            doc.text(`${index + 1}. ${tip}`);
          });

          doc.moveDown();
        }

        // Footer
        doc
          .moveDown(2)
          .fontSize(9)
          .fillColor('#999')
          .text(
            'This report is generated based on AI analysis and should be used as a guide. For critical situations, consult with a local agricultural expert.',
            { align: 'center' }
          );

        doc
          .moveDown()
          .text('AgriIQ - Intelligent Plant Health Solutions', { align: 'center' })
          .text('www.agriiq.com | support@agriiq.com', { align: 'center' });

        // Finalize PDF
        doc.end();

        stream.on('finish', () => {
          resolve({ filename, filepath });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PDFGenerator();