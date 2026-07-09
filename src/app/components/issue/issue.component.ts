import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-issue',
  templateUrl: './issue.component.html',
  styleUrls: ['./issue.component.css']
})
export class IssueComponent implements OnInit {
  issues: any[] = [];
  selectedIssue: any = null;

  ticketForm!: FormGroup;
  replyForm!: FormGroup;
  editForm!: FormGroup;
  
  createModalOpen = false;
  editModalOpen = false;
  editIssue: any = null;
  submittedTicket = false;
  submittedEdit = false;
  replyLoading = false;
  loading = false;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private formBuilder: FormBuilder,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadTickets();
    this.replyForm = this.formBuilder.group({
      message: ['', Validators.required]
    });
  }

  get isCustomer(): boolean {
    return this.authService.hasRole('CUSTOMER');
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  get isAgent(): boolean {
    return this.authService.hasRole('AGENT');
  }

  get isAdminOrAgent(): boolean {
    return this.isAdmin || this.isAgent;
  }

  loadTickets() {
    this.dataService.getIssues(0, 100).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.issues = res.data.content;
        }
      },
      error: (err) => {
        this.toastService.error('Failed to load tickets.');
      }
    });
  }

  selectIssue(issue: any) {
    this.loading = true;
    this.dataService.getIssueById(issue.id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.selectedIssue = res.data;
          this.replyForm.reset();
        }
      },
      error: () => { this.loading = false; }
    });
  }

  openCreateModal() {
    this.ticketForm = this.formBuilder.group({
      subject: ['', Validators.required],
      orderId: [null],
      description: ['', Validators.required]
    });
    this.submittedTicket = false;
    this.createModalOpen = true;
  }

  closeCreateModal() {
    this.createModalOpen = false;
  }

  openEditModal(issue: any) {
    this.editIssue = issue;
    this.editForm = this.formBuilder.group({
      subject: [issue.subject, Validators.required],
      orderId: [issue.order?.id || null],
      description: [issue.description, Validators.required]
    });
    this.submittedEdit = false;
    this.editModalOpen = true;
  }

  closeEditModal() {
    this.editModalOpen = false;
    this.editIssue = null;
  }

  get t() { return this.ticketForm.controls; }
  get e() { return this.editForm.controls; }

  submitTicket() {
    this.submittedTicket = true;
    if (this.ticketForm.invalid) return;

    this.loading = true;
    this.dataService.createIssue(this.ticketForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.toastService.success('Support ticket raised successfully!');
          this.closeCreateModal();
          this.loadTickets();
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Error occurred raising ticket.');
      }
    });
  }

  submitEdit() {
    this.submittedEdit = true;
    if (this.editForm.invalid) return;

    this.loading = true;
    this.dataService.updateIssue(this.editIssue.id, this.editForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.toastService.success('Support ticket updated successfully!');
          this.closeEditModal();
          this.loadTickets();
          if (this.selectedIssue?.id === this.editIssue.id) {
            this.selectedIssue = res.data;
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Error occurred updating ticket.');
      }
    });
  }

  deleteIssue(issue: any) {
    if (confirm('Delete this ticket?')) {
      this.dataService.deleteIssue(issue.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Support ticket deleted successfully!');
            if (this.selectedIssue?.id === issue.id) {
              this.selectedIssue = null;
            }
            this.loadTickets();
          }
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error occurred deleting ticket.');
        }
      });
    }
  }

  sendReply() {
    if (this.replyForm.invalid) return;

    this.replyLoading = true;
    this.dataService.replyToIssue(this.selectedIssue.id, this.replyForm.value).subscribe({
      next: (res) => {
        this.replyLoading = false;
        if (res.success) {
          this.selectedIssue.replies.push(res.data);
          this.replyForm.reset();
        }
      },
      error: () => { this.replyLoading = false; }
    });
  }

  resolveTicket(id: number) {
    if (confirm('Are you sure you want to mark this ticket as resolved?')) {
      this.dataService.updateIssueStatus(id, 'RESOLVED').subscribe({
        next: (res) => {
          if (res.success) {
            this.selectedIssue.status = 'RESOLVED';
            this.loadTickets();
          }
        }
      });
    }
  }
}
