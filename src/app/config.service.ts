// src/app/config.service.ts
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { tap } from "rxjs/operators";
import { Observable, firstValueFrom } from "rxjs";

// Define the structure of your application configuration
interface AppConfig {
  apiUrl: string;
  environment: string;
}

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  private appConfig: AppConfig | undefined;

  constructor(private http: HttpClient) {}

  /**
   * Loads the application configuration from config.json.
   * This method is designed to be used with APP_INITIALIZER.
   * @returns A Promise that resolves when the configuration is loaded.
   */
  async loadAppConfig(): Promise<void> {
    try {
      this.appConfig = await firstValueFrom(
        this.http.get<AppConfig>("/assets/config/config.json").pipe(
          tap((config) => {
            this.appConfig = config;
            console.log("App Config Loaded:", this.appConfig);
          })
        )
      );
    } catch (error) {
      console.error("Error loading app configuration:", error);
      // Handle error, e.g., load default config or show an error page
      throw error; // Re-throw to prevent app from starting if config is critical
    }
  }

  /**
   * Returns the loaded application configuration.
   * Throws an error if the configuration has not been loaded yet.
   */
  get config(): AppConfig {
    if (!this.appConfig) {
      throw new Error(
        "App configuration not loaded. Ensure loadAppConfig() has completed."
      );
    }
    return this.appConfig;
  }
}
