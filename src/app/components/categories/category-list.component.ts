import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css']
})
export class CategoryListComponent implements OnInit {
  categories: any[] = [];
  modalOpen = false;
  isEdit = false;
  editingCategoryId: number | null = null;
  categoryForm!: FormGroup;
  submitted = false;
  loading = false;

  constructor(
    private dataService: DataService,
    private formBuilder: FormBuilder,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.dataService.getCategories().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.categories = res.data.content || [];
        }
      },
      error: () => { this.loading = false; }
    });
  }

  openAddModal() {
    this.isEdit = false;
    this.editingCategoryId = null;
    this.categoryForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['']
    });
    this.submitted = false;
    this.modalOpen = true;
  }

  openEditModal(category: any) {
    this.isEdit = true;
    this.editingCategoryId = category.id;
    this.categoryForm = this.formBuilder.group({
      name: [category.name, Validators.required],
      description: [category.description || '']
    });
    this.submitted = false;
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
  }

  get f() { return this.categoryForm.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.categoryForm.invalid) return;

    this.loading = true;
    if (this.isEdit && this.editingCategoryId !== null) {
      this.dataService.updateCategory(this.editingCategoryId, this.categoryForm.value).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.toastService.success('Category updated successfully!');
            this.closeModal();
            this.loadCategories();
          } else {
            this.toastService.error('Failed: ' + res.message);
          }
        },
        error: (err) => { this.loading = false; this.toastService.error(err.error?.message || 'Error updating category'); }
      });
    } else {
      this.dataService.createCategory(this.categoryForm.value).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.toastService.success('Category added successfully!');
            this.closeModal();
            this.loadCategories();
          } else {
            this.toastService.error('Failed: ' + res.message);
          }
        },
        error: (err) => { this.loading = false; this.toastService.error(err.error?.message || 'Error creating category'); }
      });
    }
  }

  deleteCategory(id: number) {
    if (confirm('Are you sure you want to delete this category? It may fail if products are linked to it.')) {
      this.dataService.deleteCategory(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Category deleted successfully!');
            this.loadCategories();
          } else {
            this.toastService.error(res.message);
          }
        },
        error: (err) => { this.toastService.error(err.error?.message || 'Error deleting category.'); }
      });
    }
  }
}
