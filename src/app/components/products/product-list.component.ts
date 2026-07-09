import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  searchQuery = '';
  selectedCategoryId: number | null = null;
  selectedStatus = '';

  modalOpen = false;
  isEdit = false;
  editingProductId: number | null = null;
  productForm!: FormGroup;
  selectedFile: File | undefined = undefined;
  submitted = false;
  loading = false;

  constructor(
    private dataService: DataService,
    private formBuilder: FormBuilder,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.dataService.getCategories().subscribe({
      next: (res) => { if (res.success && res.data) this.categories = res.data.content || []; }
    });
  }

  loadProducts() {
    const params: any = { size: 100 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedCategoryId !== null && this.selectedCategoryId !== undefined && this.selectedCategoryId.toString() !== 'null') {
      params.categoryId = this.selectedCategoryId;
    }
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.dataService.getProducts(params).subscribe({
      next: (res) => { if (res.success && res.data) this.products = res.data.content; }
    });
  }

  onFilterChange() {
    this.loadProducts();
  }

  onImgError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA4MCA4MCI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM4ODgiIGZvbnQtc2l6ZT0iMTBweCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }

  openAddModal() {
    this.isEdit = false;
    this.editingProductId = null;
    this.selectedFile = undefined;
    this.productForm = this.formBuilder.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0.01)]],
      gstPercent: [18, [Validators.required, Validators.min(0)]],
      reorderLevel: [10, [Validators.required, Validators.min(0)]],
      initialStock: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      status: ['ACTIVE', Validators.required],
      description: ['']
    });
    this.submitted = false;
    this.modalOpen = true;
  }

  openEditModal(product: any) {
    this.isEdit = true;
    this.editingProductId = product.id;
    this.selectedFile = undefined;
    this.productForm = this.formBuilder.group({
      name: [product.name, Validators.required],
      price: [product.price, [Validators.required, Validators.min(0.01)]],
      gstPercent: [product.gstPercent || 0, [Validators.required, Validators.min(0)]],
      reorderLevel: [product.stock ? product.stock.reorderLevel : 10, [Validators.required, Validators.min(0)]],
      categoryId: [product.category ? product.category.id : null, Validators.required],
      status: [product.status, Validators.required],
      description: [product.description || '']
    });
    this.submitted = false;
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.editingProductId = null;
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  get f() { return this.productForm.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.productForm.invalid) return;

    this.loading = true;
    const productData = this.productForm.value;

    if (this.isEdit && this.editingProductId !== null) {
      this.dataService.updateProduct(this.editingProductId, productData, this.selectedFile).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.toastService.success('Product updated successfully!');
            this.closeModal();
            this.loadProducts();
          } else {
            this.toastService.error('Error updating product: ' + res.message);
          }
        },
        error: (err) => { this.loading = false; this.toastService.error(err.error?.message || 'Error updating product'); }
      });
    } else {
      this.dataService.createProduct(productData, this.selectedFile).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.toastService.success('Product added successfully!');
            this.closeModal();
            this.loadProducts();
          } else {
            this.toastService.error('Error creating product: ' + res.message);
          }
        },
        error: (err) => { this.loading = false; this.toastService.error(err.error?.message || 'Error creating product'); }
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('Delete this product?')) {
      this.dataService.deleteProduct(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Product deleted successfully');
            this.loadProducts();
          } else {
            this.toastService.error(res.message);
          }
        }
      });
    }
  }
}
