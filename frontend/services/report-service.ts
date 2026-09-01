import { api } from "@/lib/api-client";

export const reportService = {
  /**
   * Trigger browser download for complete corporate Excel report workbook (.xlsx).
   */
  async downloadExcelReport(): Promise<void> {
    const blob = await api.downloadBlob("/reports/export/excel");
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Corporate_Workflow_Report_${new Date().toISOString().substring(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
