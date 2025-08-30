// Mock implementation of Obsidian API for testing

export class Notice {
  constructor(public message: string, public timeout?: number) {
    // Mock implementation - just store the message
  }
}

export class Plugin {
  app: any;
  
  async onload(): Promise<void> {
    // Mock implementation
  }
  
  onunload(): void {
    // Mock implementation
  }
  
  async loadData(): Promise<any> {
    return {};
  }
  
  async saveData(data: any): Promise<void> {
    // Mock implementation
  }
}

export interface App {
  vault: {
    configDir: string;
  };
}