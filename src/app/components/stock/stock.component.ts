import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit {
  products: any[] = [];
  selectedProduct: any = null;

  adjustModalOpen = false;
  adjustForm!: FormGroup;
  submittedAdjust = false;

  editModalOpen = false;
  editForm!: FormGroup;
  submittedEdit = false;

  historyModalOpen = false;
  historyLogs: any[] = [];
  loading = false;

  constructor(
    private dataService: DataService,
    private formBuilder: FormBuilder,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.dataService.getProducts({ size: 100 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.products = res.data.content;
        }
      }
    });
  }

  openAdjustModal(product: any) {
    this.selectedProduct = product;
    this.adjustForm = this.formBuilder.group({
      actionType: ['ADD', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      remarks: ['', Validators.required]
    });
    this.submittedAdjust = false;
    this.adjustModalOpen = true;
  }

  closeAdjustModal() {
    this.adjustModalOpen = false;
    this.selectedProduct = null;
  }

  get a() { return this.adjustForm.controls; }

  submitAdjustment() {
    this.submittedAdjust = true;
    if (this.adjustForm.invalid) return;

    this.loading = true;
    const req = {
      productId: this.selectedProduct.id,
      quantity: this.adjustForm.value.quantity,
      note: this.adjustForm.value.remarks
    };

    const type = this.adjustForm.value.actionType;
    let apiCall;

    if (type === 'ADD') {
      apiCall = this.dataService.addStock(req);
    } else if (type === 'REMOVE') {
      apiCall = this.dataService.removeStock(req);
    } else {
      apiCall = this.dataService.adjustStock(req);
    }

    apiCall.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.toastService.success('Stock ledger updated successfully!');
          this.closeAdjustModal();
          this.loadInventory();
        } else {
          this.toastService.error('Adjustment failed: ' + res.message);
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Error occurred during adjustment.');
      }
    });
  }

  openEditModal(product: any) {
    this.selectedProduct = product;
    this.editForm = this.formBuilder.group({
      reorderLevel: [product.stock?.reorderLevel || 10, [Validators.required, Validators.min(1)]]
    });
    this.submittedEdit = false;
    this.editModalOpen = true;
  }

  closeEditModal() {
    this.editModalOpen = false;
    this.selectedProduct = null;
  }

  get e() { return this.editForm.controls; }

  submitEdit() {
    this.submittedEdit = true;
    if (this.editForm.invalid) return;

    this.loading = true;
    this.dataService.updateStock(this.selectedProduct.id, this.editForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.toastService.success('Stock reorder level updated!');
          this.closeEditModal();
          this.loadInventory();
        } else {
          this.toastService.error('Update failed: ' + res.message);
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Error updating stock.');
      }
    });
  }

  viewHistory(product: any) {
    this.selectedProduct = product;
    this.loading = true;
    this.dataService.getStockHistory(product.id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.historyLogs = res.data;
          this.historyModalOpen = true;
        } else {
          this.toastService.error('Failed to load stock history: ' + res.message);
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Error loading stock history.');
      }
    });
  }

  closeHistoryModal() {
    this.historyModalOpen = false;
    this.selectedProduct = null;
    this.historyLogs = [];
  }
}
