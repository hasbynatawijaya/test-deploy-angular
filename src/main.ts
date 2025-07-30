// src/main.ts
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app";
import { provideHttpClient } from "@angular/common/http"; // Import provideHttpClient
import { APP_INITIALIZER } from "@angular/core";
import { ConfigService } from "./app/config.service"; // Import your ConfigService

// Factory function to initialize the application configuration.
export function initializeApp(configService: ConfigService) {
  return () => configService.loadAppConfig();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(), // Provides HttpClient for your services
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService],
      multi: true,
    },
  ],
}).catch((err) => console.error(err));
