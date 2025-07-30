// src/app/app.component.ts
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common"; // Important for standalone components using common directives
import { ConfigService } from "./config.service";

@Component({
  selector: "app-root",
  standalone: true, // Mark as standalone component
  imports: [CommonModule], // Import CommonModule for directives like *ngIf, *ngFor
  template: `
    <h1>Welcome to {{ title }}!</h1>
    <p>This is the {{ environmentName }} environment.</p>
    <p>API URL: {{ apiUrl }}</p>
  `,
  styles: [],
})
export class AppComponent implements OnInit {
  title = "my-angular-app";
  environmentName: string = "";
  apiUrl: string = "";

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    this.environmentName = this.configService.config.environment;
    this.apiUrl = this.configService.config.apiUrl;
  }
}
