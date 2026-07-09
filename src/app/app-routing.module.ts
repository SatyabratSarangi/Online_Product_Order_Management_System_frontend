import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductListComponent } from './components/products/product-list.component';
import { CategoryListComponent } from './components/categories/category-list.component';
import { StockComponent } from './components/stock/stock.component';
import { DeliveryComponent } from './components/delivery/delivery.component';
import { ReportsComponent } from './components/reports/reports.component';
import { OrderHistoryComponent } from './components/orders/order-history.component';
import { CheckoutComponent } from './components/orders/checkout.component';
import { IssueComponent } from './components/issue/issue.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductListComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
      { path: 'categories', component: CategoryListComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
      { path: 'stock', component: StockComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
      { path: 'delivery', component: DeliveryComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN', 'AGENT'] } },
      { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
      { path: 'orders', component: OrderHistoryComponent, canActivate: [AuthGuard], data: { roles: ['CUSTOMER', 'ADMIN', 'AGENT'] } },
      { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard], data: { roles: ['CUSTOMER'] } },
      { path: 'issues', component: IssueComponent, canActivate: [AuthGuard], data: { roles: ['CUSTOMER', 'ADMIN', 'AGENT'] } }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
