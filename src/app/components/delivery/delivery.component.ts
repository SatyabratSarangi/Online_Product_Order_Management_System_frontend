import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.css']
})
export class DeliveryComponent implements OnInit {
  deliveries: any[] = [];
  selectedDelivery: any = null;
  modalOpen = false;
  deliveryForm!: FormGroup;
  loading = false;
  activeTab: 'active' | 'history' = 'active';

  constructor(
    private dataService: DataService,
    private formBuilder: FormBuilder,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadDeliveries();
  }

  loadDeliveries() {
    const params: any = { size: 50 };
    if (this.activeTab === 'history') {
      params.status = 'DELIVERED';
    }
    this.dataService.getAllDeliveries(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const all = res.data.content || [];
          this.deliveries = this.activeTab === 'active'
            ? all.filter((d: any) => d.deliveryStatus !== 'DELIVERED' && d.deliveryStatus !== 'CANCELLED')
            : all;
        }
      },
      error: (err) => {
        this.toastService.error('Failed to load deliveries.');
      }
    });
  }

  openUpdateModal(delivery: any) {
    this.selectedDelivery = delivery;

    this.deliveryForm = this.formBuilder.group({
      orderStatus: [delivery.order?.status || 'PENDING', Validators.required],
      deliveryStatus: [delivery.deliveryStatus || ''],
      deliveryPerson: [delivery.deliveryPerson || ''],
      contact: [delivery.contact || ''],
      expectedDate: [delivery.expectedDate || '']
    });

    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.selectedDelivery = null;
  }

  onSubmit() {
    if (this.deliveryForm.invalid) return;

    this.loading = true;
    const orderId = this.selectedDelivery.order.id;
    const orderStatus = this.deliveryForm.value.orderStatus;

    const deliveryData = {
      deliveryStatus: this.deliveryForm.value.deliveryStatus || '',
      deliveryPerson: this.deliveryForm.value.deliveryPerson,
      contact: this.deliveryForm.value.contact,
      expectedDate: this.deliveryForm.value.expectedDate || null
    };

    this.dataService.updateOrderStatus(orderId, orderStatus).subscribe({
      next: () => {
        const statusToSend = deliveryData.deliveryStatus || orderStatus;
        const deliveryPayload = {
          ...deliveryData,
          deliveryStatus: statusToSend
        };

        this.dataService.updateDelivery(orderId, deliveryPayload).subscribe({
          next: () => {
            this.loading = false;
            this.toastService.success('Order dispatch details saved!');
            this.closeModal();
            this.loadDeliveries();
          },
          error: (err) => {
            this.loading = false;
            this.toastService.error(err.error?.message || 'Error saving delivery log.');
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Error updating order status.');
      }
    });
  }
}
