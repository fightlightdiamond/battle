# Requirements Document

## Introduction

Tài liệu này mô tả yêu cầu cho việc thiết lập CI/CD pipeline sử dụng GitHub Actions. Pipeline sẽ tự động hóa quá trình build, chạy tests, lint code và deploy ứng dụng lên GitHub Pages khi có thay đổi code.

## Glossary

- **CI/CD Pipeline**: Quy trình tự động hóa liên tục tích hợp và triển khai code
- **GitHub Actions**: Dịch vụ CI/CD của GitHub cho phép tự động hóa workflows
- **GitHub Pages**: Dịch vụ hosting static site miễn phí của GitHub
- **Workflow**: File YAML định nghĩa các bước tự động hóa trong GitHub Actions
- **Job**: Một tập hợp các steps chạy trên cùng một runner
- **Artifact**: File hoặc thư mục được tạo ra từ workflow và có thể chia sẻ giữa các jobs

## Requirements

### Requirement 1

**User Story:** As a developer, I want the CI pipeline to automatically run when I push code or create a pull request, so that I can catch issues early in the development process.

#### Acceptance Criteria

1. WHEN a developer pushes code to the main branch THEN the CI/CD Pipeline SHALL trigger the build and test workflow
2. WHEN a developer creates a pull request targeting the main branch THEN the CI/CD Pipeline SHALL trigger the build and test workflow
3. WHEN the workflow is triggered THEN the CI/CD Pipeline SHALL checkout the repository code with full history

### Requirement 2

**User Story:** As a developer, I want the pipeline to install dependencies and cache them, so that subsequent builds are faster.

#### Acceptance Criteria

1. WHEN the workflow runs THEN the CI/CD Pipeline SHALL set up Node.js version 20 with npm caching enabled
2. WHEN dependencies are installed THEN the CI/CD Pipeline SHALL use npm ci for clean, reproducible installs
3. WHEN the workflow runs multiple times THEN the CI/CD Pipeline SHALL reuse cached node_modules when package-lock.json has not changed

### Requirement 3

**User Story:** As a developer, I want the pipeline to check code quality through linting, so that code style issues are caught automatically.

#### Acceptance Criteria

1. WHEN the build job runs THEN the CI/CD Pipeline SHALL execute the lint command to check code style
2. WHEN linting fails THEN the CI/CD Pipeline SHALL fail the workflow and report the errors
3. WHEN linting passes THEN the CI/CD Pipeline SHALL proceed to the next step

### Requirement 4

**User Story:** As a developer, I want the pipeline to run all tests, so that I can ensure code changes do not break existing functionality.

#### Acceptance Criteria

1. WHEN the build job runs THEN the CI/CD Pipeline SHALL execute the test suite using vitest
2. WHEN any test fails THEN the CI/CD Pipeline SHALL fail the workflow and report the failing tests
3. WHEN all tests pass THEN the CI/CD Pipeline SHALL proceed to the build step

### Requirement 5

**User Story:** As a developer, I want the pipeline to build the production bundle, so that I can verify the application compiles correctly.

#### Acceptance Criteria

1. WHEN tests pass THEN the CI/CD Pipeline SHALL execute the production build command
2. WHEN the build fails THEN the CI/CD Pipeline SHALL fail the workflow and report the build errors
3. WHEN the build succeeds THEN the CI/CD Pipeline SHALL produce a dist folder containing the production assets
4. WHEN building for GitHub Pages THEN the CI/CD Pipeline SHALL configure the correct base path for the repository

### Requirement 6

**User Story:** As a developer, I want the pipeline to automatically deploy to GitHub Pages when code is merged to main, so that the latest version is always available.

#### Acceptance Criteria

1. WHEN the build succeeds on the main branch THEN the CI/CD Pipeline SHALL upload the build artifacts for deployment
2. WHEN artifacts are uploaded THEN the CI/CD Pipeline SHALL trigger the GitHub Pages deployment job
3. WHEN deployment runs THEN the CI/CD Pipeline SHALL deploy the dist folder contents to GitHub Pages
4. WHEN deployment completes THEN the CI/CD Pipeline SHALL report the deployment URL

### Requirement 7

**User Story:** As a developer, I want the deployment to only happen on the main branch, so that feature branches do not accidentally deploy incomplete work.

#### Acceptance Criteria

1. WHEN code is pushed to a non-main branch THEN the CI/CD Pipeline SHALL run build and tests but skip deployment
2. WHEN a pull request is created THEN the CI/CD Pipeline SHALL run build and tests but skip deployment
3. WHEN code is merged to main THEN the CI/CD Pipeline SHALL run the full pipeline including deployment

### Requirement 8

**User Story:** As a developer, I want to see the workflow status and results clearly, so that I can quickly identify and fix issues.

#### Acceptance Criteria

1. WHEN the workflow runs THEN the CI/CD Pipeline SHALL display clear job names and step descriptions
2. WHEN a step fails THEN the CI/CD Pipeline SHALL provide detailed error output
3. WHEN the workflow completes THEN the CI/CD Pipeline SHALL show the overall status (success/failure)
