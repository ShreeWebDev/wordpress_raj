const ExcelJS = require('exceljs');

const exportShipmentToExcel = async (shipment, items, role, res) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Wholesaledock';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Shipment');

  // Header info
  ws.addRow(['Container No:', shipment.container_no]);
  ws.addRow(['ETD:', shipment.etd || '']);
  ws.addRow(['ETA:', shipment.eta || '']);
  ws.addRow([]);

  // Column definitions based on role
  const isAdmin = ['admin'].includes(role);
  const isAgentOrAdmin = ['admin', 'agent'].includes(role);

  const cols = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'No. of Ctns', key: 'no_of_ctns', width: 12 },
    { header: 'Ctn Qty', key: 'ctn_qty', width: 10 },
    { header: 'Total Qty', key: 'total_qty', width: 10 },
  ];

  if (isAgentOrAdmin) {
    cols.push({ header: 'Rate RMB', key: 'rate_rmb', width: 12 });
    cols.push({ header: 'Ctn CBM', key: 'ctn_cbm', width: 12 });
    cols.push({ header: 'Total CBM', key: 'total_cbm', width: 12 });
    cols.push({ header: 'Ctn Weight', key: 'ctn_weight', width: 12 });
    cols.push({ header: 'Total Weight', key: 'total_weight', width: 12 });
  }

  if (isAdmin) {
    cols.push({ header: 'Transfer Rate', key: 'transfer_rate', width: 14 });
    cols.push({ header: 'CBM Rate', key: 'cbm_rate', width: 12 });
    cols.push({ header: 'Cost INR', key: 'cost_inr', width: 14 });
  }

  ws.columns = cols;

  // Style header row (row 5)
  const headerRow = ws.addRow(cols.map(c => c.header));
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3c5e' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { horizontal: 'center' };
    cell.border = { bottom: { style: 'thin' } };
  });

  for (const item of items) {
    const detail = item.order?.detail || {};
    const totalCbm = parseFloat(item.total_cbm || 0);
    const totalQty = parseInt(item.total_qty || 1);
    const rateRmb = parseFloat(detail.rate_rmb || 0);
    const transferRate = parseFloat(shipment.transfer_rate || 0);
    const cbmRate = parseFloat(shipment.cbm_rate || 0);
    const costInr = totalQty > 0
      ? ((rateRmb * transferRate) + (totalCbm * cbmRate / totalQty)).toFixed(2)
      : '0.00';

    const rowData = {
      sku: item.order?.product?.sku || '',
      name: item.order?.product?.name || '',
      no_of_ctns: item.no_of_ctns || '',
      ctn_qty: detail.ctn_qty || '',
      total_qty: item.total_qty || '',
    };

    if (isAgentOrAdmin) {
      rowData.rate_rmb = detail.rate_rmb || '';
      rowData.ctn_cbm = detail.ctn_cbm || '';
      rowData.total_cbm = item.total_cbm || '';
      rowData.ctn_weight = detail.ctn_weight || '';
      rowData.total_weight = item.total_weight || '';
    }

    if (isAdmin) {
      rowData.transfer_rate = shipment.transfer_rate || '';
      rowData.cbm_rate = shipment.cbm_rate || '';
      rowData.cost_inr = costInr;
    }

    ws.addRow(Object.values(rowData));
  }

  // Auto-fit columns
  ws.columns.forEach(col => { if (col.width) col.width = Math.max(col.width, 12); });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="shipment_${shipment.container_no}_${Date.now()}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

module.exports = { exportShipmentToExcel };
