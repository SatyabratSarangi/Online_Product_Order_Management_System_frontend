import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  groupBy = 'MONTH';
  fromDate = '';
  toDate = '';
  summary: any = null;
  items: any[] = [];
  loading = false;

  constructor(
    private dataService: DataService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadReport();
  }

  loadReport() {
    this.loading = true;
    this.dataService.getSalesReport(this.groupBy, this.fromDate || undefined, this.toDate || undefined).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.summary = res.data;
          this.items = res.data.items || [];
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getPercentage(value: number): number {
    if (this.items.length === 0) return 0;
    const maxVal = Math.max(...this.items.map(item => item.totalSales), 1);
    return (value / maxVal) * 100;
  }

  getShare(value: number): string {
    if (!this.summary || !this.summary.totalRevenue || this.summary.totalRevenue === 0) return '0';
    return ((value / this.summary.totalRevenue) * 100).toFixed(1);
  }

  exportReport(format: string) {
    this.dataService.exportReport(format, this.groupBy, this.fromDate || undefined, this.toDate || undefined).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'excel' ? 'xlsx' : 'pdf';
        a.download = `sales_report_${this.groupBy.toLowerCase()}.${ext}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.error('Failed to download report files.');
      }
    });
  }
}
