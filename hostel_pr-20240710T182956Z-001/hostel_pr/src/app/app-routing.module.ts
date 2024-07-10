import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ManagementComponent } from './management/management.component';
import { StudentComponent } from './student/student.component';
import { SendmailComponent } from './others/sendmail/sendmail.component';
import { EmployeeWardenComponent } from './employee-warden/employee-warden.component';
import { EmployeeComponent } from './employee/employee.component';
import { HomeComponent } from './studentcmp/home/home.component';
import { ApplicationsComponent } from './applications/applications.component';
import { QrloginComponent } from './qrlogin/qrlogin.component';

const routes: Routes = [
  {
    path:'',
    component:LoginComponent
  },
  {
    path:'management',
    component:ManagementComponent,
    children:[
      {path:'sendmail/:mail/:unq',component:SendmailComponent}
    ]
  },
  {
    path:'login/student/:id',
    component:StudentComponent,
    children:[
      {path:'home',component:HomeComponent}
    ]
  },
  {
    path:'login/warden/:id',
    component:EmployeeWardenComponent,
    children:[

    ]
  },
  {
    path:'login/employee/:id',
    component:EmployeeComponent
  },
  {
    path:'studen_application/:id',
    component:ApplicationsComponent
  },
  {
    path:'qr_scanned',
    component:QrloginComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
