// src/services/exportService.ts - Reusable Export Service
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
  width?: number;
}

export interface ExportOptions {
  filename?: string;
  title?: string;
  includeTimestamp?: boolean;
  dateFormat?: string;
}

export type ExportFormat = 'csv' | 'txt' | 'pdf' | 'json';

class ExportService {
  /**
   * Export data to CSV format
   */
  static exportToCSV<T extends Record<string, any>>(
    data: T[], 
    columns: ExportColumn[], 
    options: ExportOptions = {}
  ): void {
    const { 
      filename = 'export', 
      includeTimestamp = true, 
      dateFormat = 'yyyy-MM-dd_HH-mm' 
    } = options;
    
    const headers = columns.map(col => `"${col.header}"`);
    const rows = data.map(item => 
      columns.map(col => {
        const value = item[col.key];
        const formattedValue = col.formatter ? col.formatter(value) : value;
        return this.escapeCSVValue(formattedValue);
      })
    );
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const timestamp = includeTimestamp ? `_${format(new Date(), dateFormat)}` : '';
    this.downloadFile(csvContent, `${filename}${timestamp}.csv`, 'text/csv');
  }

  /**
   * Export data to text format
   */
  static exportToText<T extends Record<string, any>>(
    data: T[], 
    columns: ExportColumn[], 
    options: ExportOptions = {}
  ): void {
    const { 
      filename = 'export', 
      title = 'Datenexport',
      includeTimestamp = true, 
      dateFormat = 'yyyy-MM-dd_HH-mm' 
    } = options;
    
    const separator = '='.repeat(80);
    const subSeparator = '-'.repeat(50);
    
    const textContent = [
      separator,
      title.toUpperCase(),
      `Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}`,
      `Anzahl Datensätze: ${data.length}`,
      separator,
      '',
      ...data.map((item, index) => [
        `${index + 1}. Datensatz`,
        ...columns.map(col => {
          const value = item[col.key];
          const formattedValue = col.formatter ? col.formatter(value) : value;
          return `   ${col.header}: ${formattedValue || '-'}`;
        }),
        subSeparator,
        ''
      ].join('\n'))
    ].join('\n');
    
    const timestamp = includeTimestamp ? `_${format(new Date(), dateFormat)}` : '';
    this.downloadFile(textContent, `${filename}${timestamp}.txt`, 'text/plain');
  }

  /**
   * Export data to JSON format
   */
  static exportToJSON<T extends Record<string, any>>(
    data: T[], 
    options: ExportOptions = {}
  ): void {
    const { 
      filename = 'export', 
      title = 'Datenexport',
      includeTimestamp = true, 
      dateFormat = 'yyyy-MM-dd_HH-mm' 
    } = options;
    
    const exportData = {
      metadata: {
        title,
        exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        totalRecords: data.length,
        version: '1.0'
      },
      data
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const timestamp = includeTimestamp ? `_${format(new Date(), dateFormat)}` : '';
    this.downloadFile(jsonContent, `${filename}${timestamp}.json`, 'application/json');
  }

  /**
   * Generate printable HTML for PDF export
   */
  static generatePrintableHTML<T extends Record<string, any>>(
    data: T[], 
    columns: ExportColumn[], 
    options: ExportOptions = {}
  ): string {
    const { title = 'Datenexport' } = options;
    
    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0;
            padding: 20px; 
            font-size: 11px;
            line-height: 1.4;
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
        }
        .header h1 { 
            margin: 0 0 10px 0; 
            color: #1e40af; 
            font-size: 24px;
            font-weight: 600;
        }
        .header .subtitle { 
            margin: 5px 0; 
            color: #6b7280; 
            font-size: 12px;
        }
        .summary {
            background-color: #f8fafc;
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-left: 4px solid #2563eb;
        }
        .summary-item {
            display: inline-block;
            margin-right: 30px;
            font-weight: 500;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            font-size: 10px;
        }
        th, td { 
            border: 1px solid #d1d5db; 
            padding: 6px 8px; 
            text-align: left;
            vertical-align: top;
        }
        th { 
            background-color: #f3f4f6; 
            font-weight: 600;
            color: #374151;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
        tr:nth-child(even) { 
            background-color: #f9fafb; 
        }
        tr:hover {
            background-color: #f3f4f6;
        }
        .status-active { 
            color: #059669; 
            font-weight: 600;
            background-color: #dcfce7;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
        }
        .status-inactive { 
            color: #dc2626; 
            font-weight: 600;
            background-color: #fee2e2;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            color: #6b7280;
            font-size: 9px;
        }
        @media print {
            body { 
                margin: 0; 
                padding: 10px;
            }
            .no-print { 
                display: none !important; 
            }
            table {
                font-size: 9px;
            }
            th, td {
                padding: 4px 6px;
            }
            .header h1 {
                font-size: 18px;
            }
            .page-break {
                page-break-before: always;
            }
        }
        @page {
            margin: 1cm;
            size: A4 landscape;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <div class="subtitle">Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
    </div>
    
    <div class="summary">
        <span class="summary-item">📊 Anzahl Datensätze: ${data.length}</span>
        <span class="summary-item">📅 Exportdatum: ${format(new Date(), 'dd.MM.yyyy')}</span>
        <span class="summary-item">🕐 Exportzeit: ${format(new Date(), 'HH:mm')}</span>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 40px;">#</th>
                ${columns.map(col => `
                    <th${col.width ? ` style="width: ${col.width}px;"` : ''}>${col.header}</th>
                `).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.map((item, index) => `
                <tr>
                    <td style="text-align: center; font-weight: 500;">${index + 1}</td>
                    ${columns.map(col => {
                      const value = item[col.key];
                      const formattedValue = col.formatter ? col.formatter(value) : (value || '-');
                      return `<td>${formattedValue}</td>`;
                    }).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        <p>Deutschkurse Management System • Seite 1 von 1 • Generiert mit ExportService v1.0</p>
    </div>
</body>
</html>`;
  }

  /**
   * Export data to PDF (opens print dialog)
   */
  static exportToPDF<T extends Record<string, any>>(
    data: T[], 
    columns: ExportColumn[], 
    options: ExportOptions = {}
  ): void {
    const htmlContent = this.generatePrintableHTML(data, columns, options);
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close window after printing (optional)
          printWindow.onafterprint = () => {
            printWindow.close();
          };
        }, 500);
      };
    } else {
      throw new Error('Popup-Blocker verhindert den PDF-Export. Bitte erlauben Sie Popups für diese Seite.');
    }
  }

  /**
   * Universal export function
   */
  static export<T extends Record<string, any>>(
    format: ExportFormat,
    data: T[], 
    columns: ExportColumn[], 
    options: ExportOptions = {}
  ): void {
    if (!data || data.length === 0) {
      throw new Error('Keine Daten zum Exportieren vorhanden');
    }

    switch (format) {
      case 'csv':
        this.exportToCSV(data, columns, options);
        break;
      case 'txt':
        this.exportToText(data, columns, options);
        break;
      case 'pdf':
        this.exportToPDF(data, columns, options);
        break;
      case 'json':
        this.exportToJSON(data, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Utility functions
  private static escapeCSVValue(value: any): string {
    if (value === null || value === undefined) return '""';
    
    const stringValue = String(value);
    
    // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return `"${stringValue}"`;
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: `${mimeType};charset=utf-8;` });
    
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fallback for older browsers
      throw new Error('Download nicht unterstützt in diesem Browser');
    }
  }

  /**
   * Batch export multiple datasets
   */
  static exportBatch<T extends Record<string, any>>(
    exports: Array<{
      name: string;
      data: T[];
      columns: ExportColumn[];
      format: ExportFormat;
      options?: ExportOptions;
    }>
  ): void {
    exports.forEach((exportConfig, index) => {
      setTimeout(() => {
        try {
          this.export(
            exportConfig.format,
            exportConfig.data,
            exportConfig.columns,
            {
              ...exportConfig.options,
              filename: exportConfig.options?.filename || exportConfig.name
            }
          );
        } catch (error) {
          console.error(`Batch export failed for ${exportConfig.name}:`, error);
          throw error;
        }
      }, index * 100); // Small delay between downloads
    });
  }

  /**
   * Get file size estimate
   */
  static getFileSizeEstimate<T extends Record<string, any>>(
    data: T[],
    format: ExportFormat
  ): string {
    const jsonSize = JSON.stringify(data).length;
    
    let sizeInBytes: number;
    switch (format) {
      case 'csv':
        sizeInBytes = jsonSize * 0.7; // CSV is usually smaller
        break;
      case 'txt':
        sizeInBytes = jsonSize * 1.2; // Text with formatting is larger
        break;
      case 'json':
        sizeInBytes = jsonSize;
        break;
      case 'pdf':
        sizeInBytes = jsonSize * 2; // PDF has overhead
        break;
      default:
        sizeInBytes = jsonSize;
    }
    
    if (sizeInBytes < 1024) return `${Math.round(sizeInBytes)} B`;
    if (sizeInBytes < 1024 * 1024) return `${Math.round(sizeInBytes / 1024)} KB`;
    return `${Math.round(sizeInBytes / (1024 * 1024))} MB`;
  }
}

// Common formatters for reuse
export const CommonFormatters = {
  date: (value: string | Date) => {
    if (!value) return '-';
    try {
      return format(new Date(value), 'dd.MM.yyyy');
    } catch {
      return String(value);
    }
  },
  
  datetime: (value: string | Date) => {
    if (!value) return '-';
    try {
      return format(new Date(value), 'dd.MM.yyyy HH:mm');
    } catch {
      return String(value);
    }
  },
  
  boolean: (value: boolean) => value ? 'Ja' : 'Nein',
  
  status: (value: boolean) => value ? 'Aktiv' : 'Inaktiv',
  
  currency: (value: number) => {
    if (typeof value !== 'number') return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  },
  
  number: (value: number) => {
    if (typeof value !== 'number') return '-';
    return new Intl.NumberFormat('de-DE').format(value);
  },
  
  gender: (value: string) => {
    switch (value) {
      case 'm': return 'Männlich';
      case 'w': return 'Weiblich';
      case 'd': return 'Divers';
      default: return '-';
    }
  },
  
  email: (value: string) => value || '-',
  
  phone: (value: string) => value || '-',
  
  truncate: (maxLength: number = 50) => (value: string) => {
    if (!value) return '-';
    return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
  }
};

export default ExportService;