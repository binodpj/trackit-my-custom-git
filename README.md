
# Trackit-my-custom-git

Trackit is a basic implementation of a version control system, similar to Git. It allows users to create a repository, add files, commit changes, and view the commit history.

## Features
- Create a new repository with **trackit init**
- Add files to the repository with **trackit add <file>**
- Commit changes with **trackit commit <message>**
- View the commit history with **trackit log**
- Show the differences between two commits with **trackit diff <commitHash>**



## Usage

Initialize a new repository
```bash
  trackit init
```

Add a file to the repository
```bash
    trackit add <file>
```

Commit Changes
```bash
    trackit commit <message>
```

View commit history
```bash
    trackit log
```

Show the differences between two commits
```bash
    trackit diff <commitHash>
```


## Technical Details

- Trackit uses a simple file-based storage system to store the repository data.
- Each commit is stored as a JSON file in the **.trackit/objects** directory.
- The **hashObject** function uses SHA-1 to generate a unique hash for each file.
- The diff function uses the **diff** library to show the differences between two commits.
## Dependencies

- **Node.js**
- **fs** and **path** modules
- **crypto** module for hashing
- **diff** library for showing differences
- **chalk** library for colored output