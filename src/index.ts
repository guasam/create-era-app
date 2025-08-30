#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import replace from 'replace-in-file';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CreateOptions {
  name?: string;
  yes?: boolean;
  git?: boolean;
  install?: boolean;
}

interface ProjectConfig {
  git: boolean;
  install: boolean;
  packageManager: string;
  welcomeKit: boolean;
}

class CreateElectronReactApp {
  private program: Command;
  private templateVersion: string;

  constructor() {
    this.program = new Command();
    this.templateVersion = this.getTemplateVersion();
    this.setupCommands();
  }

  private getTemplateVersion(): string {
    try {
      const templatePackagePath = path.join(__dirname, 'template', 'package.json');
      const templatePackage = fs.readJsonSync(templatePackagePath);
      return templatePackage.version;
    } catch (error) {
      return 'unknown';
    }
  }

  private setupCommands() {
    this.program
      .name('create-electron-react-app')
      .description('Create a modern Electron app with React, TypeScript, and TailwindCSS')
      .version('1.0.0')
      .argument('[name]', 'Project name')
      .option('-y, --yes', 'Skip prompts and use defaults')
      .option('--no-git', 'Skip git initialization')
      .option('--no-install', 'Skip dependency installation')
      .action(async (name: string, options: CreateOptions) => {
        await this.createApp(name, options);
      });

    this.program.parse();
  }

  private async createApp(name?: string, options: CreateOptions = {}) {
    try {
      console.log(chalk.blue.bold('\n🚀 Create Electron React App\n'));

      // Show template version as first step
      console.log(chalk.cyan('📦 Framework version:'), chalk.white(`v${this.templateVersion}`));

      // Get project name
      const projectName = name || (await this.getProjectName());
      const projectPath = path.resolve(process.cwd(), projectName);

      // Check if directory exists
      if (await fs.pathExists(projectPath)) {
        console.log(chalk.red(`❌ Directory "${projectName}" already exists!`));
        process.exit(1);
      }

      // Get options
      const config = await this.getConfig(options);

      // Create project
      await this.generateProject(projectName, projectPath, config);

      // Post-creation steps
      await this.postCreate(projectPath, config);

      this.showSuccessMessage(projectName, config);
    } catch (error) {
      console.error(chalk.red('\n❌ Error creating project:'), error);
      process.exit(1);
    }
  }

  private async getProjectName(): Promise<string> {
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What is your project named?',
        default: 'my-electron-app',
        validate: (input: string) => {
          if (!input.trim()) return 'Project name is required';
          if (!/^[a-z0-9-]+$/.test(input)) {
            return 'Project name must be lowercase with hyphens only';
          }
          return true;
        },
      },
    ]);
    return name;
  }

  private async getConfig(options: CreateOptions): Promise<ProjectConfig> {
    if (options.yes) {
      return {
        git: options.git !== false,
        install: options.install !== false,
        packageManager: 'npm',
        welcomeKit: true,
      };
    }

    const { git, install, packageManager, welcomeKit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'git',
        message: 'Initialize a git repository?',
        default: options.git !== false,
      },
      {
        type: 'confirm',
        name: 'install',
        message: 'Install dependencies?',
        default: options.install !== false,
      },
      {
        type: 'list',
        name: 'packageManager',
        message: 'Which package manager would you like to use?',
        choices: [
          { name: 'npm', value: 'npm' },
          { name: 'yarn', value: 'yarn' },
          { name: 'pnpm', value: 'pnpm' },
          { name: 'bun', value: 'bun' },
        ],
        default: 'npm',
        when: (answers) => answers.install,
      },
      {
        type: 'confirm',
        name: 'welcomeKit',
        message: 'Include interactive project showcase demo?',
        default: true,
      },
    ]);

    return { git, install, packageManager, welcomeKit };
  }

  private async generateProject(projectName: string, projectPath: string, config: ProjectConfig) {
    const spinner = ora('Creating project...').start();

    try {
      // Copy template
      const templatePath = path.join(__dirname, 'template');
      await fs.copy(templatePath, projectPath);

      // Handle welcome kit choice
      if (!config.welcomeKit) {
        await this.removeWelcomeKit(projectPath);
      }



      // Update package.json
      await this.updatePackageJson(projectPath, projectName);

      // Update other files with project name
      await this.replaceProjectName(projectPath, projectName);

      spinner.succeed('Project created successfully!');
    } catch (error) {
      spinner.fail('Failed to create project');
      throw error;
    }
  }

  private async updatePackageJson(projectPath: string, projectName: string) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);

    packageJson.name = projectName;
    packageJson.description = `A modern Electron application built with ${projectName}`;

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }



  private async removeWelcomeKit(projectPath: string) {
    try {
      // Remove welcome kit directory
      const welcomeKitPath = path.join(projectPath, 'app', 'components', 'welcome');
      await fs.remove(welcomeKitPath);

      // Update app.tsx to remove welcome kit import and usage
      const appTsxPath = path.join(projectPath, 'app', 'app.tsx');
      const appContent = await fs.readFile(appTsxPath, 'utf-8');

      // Remove welcome kit import and replace with a simple app structure
      const newAppContent = `import './styles/app.css'

export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to your Electron App!
        </h1>
        <p className="text-muted-foreground">
          Start building your desktop application.
        </p>
      </div>
    </div>
  )
}`;

      await fs.writeFile(appTsxPath, newAppContent);
    } catch (error) {
      console.warn('Warning: Could not remove welcome kit:', (error as Error).message);
    }
  }

  private async replaceProjectName(projectPath: string, projectName: string) {
    try {
      const files = await glob('**/*', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'dist/**', 'out/**', '.git/**', '*.log', 'package.json'],
        nodir: true, // Only include files, not directories
      });

      if (files.length > 0) {
        const options = {
          files: files.map((file) => path.join(projectPath, file)),
          from: [
            /\bera\b(?!\.svg)/g, // Word boundary for "era" but not followed by .svg
            /\bElectronReactApp\b/g, // Word boundary for "ElectronReactApp"
            /\belectron-react-app\b/g // Word boundary for "electron-react-app"
          ],
          to: [projectName, projectName.charAt(0).toUpperCase() + projectName.slice(1), projectName],
        };

        await replace(options);
      }
    } catch (error) {
      // If replace fails, continue without it
      console.warn('Warning: Could not replace project names in files:', (error as Error).message);
    }
  }

  private async postCreate(projectPath: string, config: ProjectConfig) {
    if (config.git) {
      const spinner = ora('Initializing git repository...').start();
      try {
        const { execSync } = await import('child_process');
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        spinner.succeed('Git repository initialized!');
      } catch (error) {
        spinner.fail('Failed to initialize git repository');
      }
    }

    if (config.install) {
      const spinner = ora(`Installing dependencies with ${config.packageManager}...`).start();
      try {
        const { execSync } = await import('child_process');
        const installCommand = this.getInstallCommand(config.packageManager);
        execSync(installCommand, { cwd: projectPath, stdio: 'inherit' });
        spinner.succeed('Dependencies installed successfully!');
      } catch (error) {
        spinner.fail('Failed to install dependencies');
      }
    }
  }

  private getInstallCommand(packageManager: string): string {
    switch (packageManager) {
      case 'yarn':
        return 'yarn install';
      case 'pnpm':
        return 'pnpm install';
      case 'bun':
        return 'bun install';
      default:
        return 'npm install';
    }
  }

  private showSuccessMessage(projectName: string, config: ProjectConfig) {
    console.log(chalk.green.bold('\n✅ Project created successfully!\n'));

    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  cd ${projectName}`));

    if (!config.install) {
      console.log(chalk.white(`  ${config.packageManager} install`));
    }

    console.log(chalk.white('  npm run dev'));

    console.log(chalk.cyan('\n📚 Documentation:'));
    console.log(chalk.white('  https://github.com/guasam/electron-react-app'));

    console.log(chalk.cyan('\n🎉 Happy coding!\n'));
  }
}

export function createApp() {
  new CreateElectronReactApp();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createApp();
}
