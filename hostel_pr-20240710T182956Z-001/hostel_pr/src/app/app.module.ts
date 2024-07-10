import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { ManagementComponent } from './management/management.component';
import { StudentComponent } from './student/student.component';
import { SendmailComponent } from './others/sendmail/sendmail.component';
import { EmployeeWardenComponent } from './employee-warden/employee-warden.component';
import { EmployeeComponent } from './employee/employee.component';
import { HomeComponent } from './studentcmp/home/home.component';
import { ApplicationsComponent } from './applications/applications.component';
import { WardenhomeComponent } from './empwarden/wardenhome/wardenhome.component';
import { WardenprofileComponent } from './empwarden/wardenprofile/wardenprofile.component';
import { WardenroomstComponent } from './empwarden/wardenroomst/wardenroomst.component';
import { WardenstudentsComponent } from './empwarden/wardenstudents/wardenstudents.component';
import { WardenemployeesComponent } from './empwarden/wardenemployees/wardenemployees.component';
import { WardenapplicationsComponent } from './empwarden/wardenapplications/wardenapplications.component';
import { WardenmsgsComponent } from './empwarden/wardenmsgs/wardenmsgs.component';
import { QrloginComponent } from './qrlogin/qrlogin.component';
import { StprofileComponent } from './studentcmp/stprofile/stprofile.component';
import { SttransComponent } from './studentcmp/sttrans/sttrans.component';
import { StaboutComponent } from './studentcmp/stabout/stabout.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ManagementComponent,
    StudentComponent,
    SendmailComponent,
    EmployeeWardenComponent,
    EmployeeComponent,
    HomeComponent,
    ApplicationsComponent,
    WardenhomeComponent,
    WardenprofileComponent,
    WardenroomstComponent,
    WardenstudentsComponent,
    WardenemployeesComponent,
    WardenapplicationsComponent,
    WardenmsgsComponent,
    QrloginComponent,
    StprofileComponent,
    SttransComponent,
    StaboutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
