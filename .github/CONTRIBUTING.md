# Contribution Guidelines for the RESTful User Management API

Thank you for your interest in contributing to our project! We appreciate your help and want to make the process as easy and transparent as possible. By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

### Getting Started

1.  **Fork the repository:** Start by forking the project to your own GitHub account. This creates a personal copy where you can make changes without affecting the main repository.

2.  **Clone your fork:** Clone the forked repository to your local machine using the following command:
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name
    ```

3.  **Install dependencies:** Navigate to the project directory and install all the necessary packages.
    ```bash
    npm install
    ```

4.  **Create a new branch:** Always create a new branch for your work. This keeps the main branch clean and makes it easier to manage your contributions. Use a descriptive name that reflects your changes.
    * **Features:** `feat/add-user-login`
    * **Bug fixes:** `fix/update-password-bug`
    * **Documentation:** `docs/update-readme`
    * **Refactoring:** `refactor/optimize-routes`

    ```bash
    git checkout -b your-branch-name
    ```

---

### Making Changes and Submitting a Pull Request

#### **Coding Style**
* Follow the existing **coding style and conventions** in the codebase.
* Write clear and well-documented code. Add comments where the logic is complex.

#### **Commit Messages**
* We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This helps us write a clear commit history.
* Your commit message should describe what you did and why.
* **Examples:**
    * `feat: add new endpoint for user preferences`
    * `fix: resolve user update validation error`
    * `refactor: consolidate error handling logic`

#### **Pull Requests (PRs)**
* Before submitting your PR, ensure your changes are **rebased on the latest main branch** to avoid conflicts.
* All PRs should be linked to an existing issue. If an issue doesn't exist, please **create one first**.
* Fill out the **pull request template** completely, providing as much detail as possible about your changes, including a summary, the motivation behind the change, and any relevant screenshots or a video.

#### **Testing**
* Please ensure your changes do not break any existing functionality.
* If you're adding a new feature, include a brief description of how to test it.

### Final Steps

Once your code is ready, push it to your forked repository and open a pull request. A maintainer will review your changes, and once approved, your code will be merged into the main branch.

Thank you for your contribution!