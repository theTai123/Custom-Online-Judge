# Custom Online Judge

Custom Online Judge (OJ) is a programming contest judging system built with **Express.js** and **SQLite3**. It provides a platform for managing programming problems, submitting source code, and automatically evaluating solutions.

Currently, the system only supports judging **C++ submissions**.

## Technologies

- **Express.js** – Backend web framework.
- **SQLite3** – Database for storing application data.
- **Node.js** – JavaScript runtime environment.
- **C++** – The currently supported programming language for submissions.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- A C++ compiler, such as g++.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/theTai123/Custom-Online-Judge.git
   ```

2. Navigate to the project directory:

   ```bash
   cd Custom-Online-Judge
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

### Create Required Directories

Before starting the server, create the following two directories at the root of the project:

- `problems/` – Stores programming problems and their test cases.
- `uploads/` – Stores users' submissions.

The directory structure should look like this:

```text
Custom-Online-Judge/
├── problems/
├── uploads/
├── judge/
├── package.json
└── ...
```

## Problem Structure

Each programming problem is stored in its own directory inside `problems/`.

A problem directory contains:

1. A Markdown file named `statement.md` containing the problem statement.
2. A `tests/` directory containing multiple test case directories.

Markdown problem statements support mathematical notation for displaying formulas and equations.

### Example

```text
problems/
└── [problem_id]/
    ├── statement.md
    └── tests/
        ├── test01/
        │   ├── test01.INP
        │   └── test01.OUT
        ├── test02/
        │   ├── test02.INP
        │   └── test02.OUT
        └── ...
```

### Test Case Structure

Each test case is stored in a separate directory inside `tests/`.

Every test case directory contains two files:

- `INP` – The input file.
- `OUT` – The expected output file.

Test case directory names can follow formats such as:

- `test01`
- `TEST01`
- `1`

Example:

```text
tests/
├── TEST01/
│   ├── TEST01.INP
│   └── TEST01.OUT
├── TEST02/
│   ├── TEST02.INP
│   └── TEST02.OUT
└── TEST03/
    ├── TEST03.INP
    └── TEST03.OUT
```

The test case directory name is case-insensitive. Each directory must contain both `INP` and `OUT` files.

### Mathematical Notation

Problem statements are written in Markdown and support mathematical notation, allowing you to display mathematical expressions and formulas in a readable format.

Example:

```markdown
# Sum of Two Numbers

Given two integers \(a\) and \(b\), calculate:

\[
a + b
\]
```

The exact mathematical syntax supported depends on the Markdown rendering configuration.

### Initialize Problems in the Database

Before starting the server, you must manually add the programming problems to the database using the `init.sql` file.

Insert each problem into the `problems` table using the following syntax:

```sql
INSERT INTO problems (problem_id, title, time_limit, memory_limit, num_of_tests, score)
```

#### Example

```sql
INSERT INTO problems (problem_id, title, time_limit, memory_limit, num_of_tests, score)
VALUES (1, 'Sum of Two Numbers', 1000, 256, 3, 100);
```

The fields represent:

| Field          | Description                       |
| -------------- | --------------------------------- |
| `problem_id`   | Unique ID of the problem.         |
| `title`        | Problem title.                    |
| `time_limit`   | Time limit for each submission.   |
| `memory_limit` | Memory limit for each submission. |
| `num_of_tests` | Number of test cases.             |
| `score`        | Total score of the problem.       |

Make sure that the `problem_id` matches the name of the corresponding problem directory in `problems/`.

For example, if the `problem_id` is `aplusb`, the problem directory must be named `aplusb`.

Make sure that the problem information in the database matches the corresponding problem directory in `problems/`.

After adding the problems, proceed with compiling the runner and starting the server.

## Usage

### 1. Compile the Runner

Before starting the server, compile `runner.cpp` in the `judge` directory.

Compile the runner:

```bash
g++ grader.cpp -o grader
```

### 2. Start the Server

Run the following command in the project root directory:

```bash
npm start
```

The server will start, and the application will be available at the configured address.

### 3. Default Admin Account

When the server is started for the first time, the system automatically creates an administrator account with the following credentials:

| Field    | Value      |
| -------- | ---------- |
| Username | `admin`    |
| Password | `admin123` |

Use this account to log in and access the system.

**Security note:** Change the default password after the first login, especially if the application is deployed publicly.

### 4. Submit C++ Code

Currently, Custom Online Judge supports C++ submissions only.

Users can submit their C++ source code to a programming problem. The system will compile and evaluate the submission against the corresponding test cases.

## Project Structure

```text
Custom-Online-Judge/
├── problems/
│   └── [problem_name]/
│       ├── statement.md
│       └── tests/
│           ├── test01.INP
│           ├── test01.OUT
│           └── ...
├── uploads/
├── judge/
│   ├── runner.cpp
│   ├── sandbox
│   └── grader.js
├── package.json
├── README.md
└── ...
```

## Development

This project is under active development. Future improvements may include support for additional programming languages, enhanced judging features, and improvements to the user interface.
