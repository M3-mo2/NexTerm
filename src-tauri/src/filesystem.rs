use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Represents a file or directory entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_file: bool,
    pub is_symlink: bool,
    pub size: u64,
    pub modified: u64,
    pub extension: Option<String>,
    pub children_loaded: bool,
}

/// Read directory contents and return entries
#[tauri::command]
pub fn read_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir_path = Path::new(&path);

    if !dir_path.exists() || !dir_path.is_dir() {
        return Err(format!("Directory does not exist or is not a directory: {}", path));
    }

    let mut entries = Vec::new();

    let dir_entries = fs::read_dir(dir_path).map_err(|e| format!("Failed to read directory: {}", e))?;
    for entry in dir_entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata().map_err(|e| format!("Failed to read metadata: {}", e))?;
        let name = entry
            .file_name()
            .to_string_lossy()
            .to_string();
        let entry_path = entry.path().to_string_lossy().to_string();

        // Skip hidden files/dirs on Windows (starting with .)
        // but allow them to be shown via option in the future
        let is_symlink = metadata.is_symlink();
        let is_dir = metadata.is_dir();
        let is_file = metadata.is_file();

        let extension = if is_file {
            Path::new(&name)
                .extension()
                .map(|e| e.to_string_lossy().to_string())
        } else {
            None
        };

        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);

        entries.push(FileEntry {
            name,
            path: entry_path,
            is_dir,
            is_file,
            is_symlink,
            size: metadata.len(),
            modified,
            extension,
            children_loaded: false,
        });
    }

    // Sort: directories first, then files, alphabetically
    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

/// Read file content as text
#[tauri::command]
pub fn read_file_content(path: String) -> Result<String, String> {
    let file_path = Path::new(&path);
    if !file_path.exists() || !file_path.is_file() {
        return Err(format!("File does not exist: {}", path));
    }
    let content = fs::read_to_string(file_path).map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(content)
}

/// Write content to a file
#[tauri::command]
pub fn write_file_content(path: String, content: String) -> Result<(), String> {
    let file_path = Path::new(&path);
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directories: {}", e))?;
    }
    fs::write(file_path, content).map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(())
}

/// Create a new file
#[tauri::command]
pub fn create_file(path: String) -> Result<(), String> {
    let file_path = Path::new(&path);
    if file_path.exists() {
        return Err(format!("File already exists: {}", path));
    }
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directories: {}", e))?;
    }
    fs::File::create(file_path).map_err(|e| format!("Failed to create file: {}", e))?;
    Ok(())
}

/// Create a new directory
#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    let dir_path = Path::new(&path);
    if dir_path.exists() {
        return Err(format!("Directory already exists: {}", path));
    }
    fs::create_dir_all(dir_path).map_err(|e| format!("Failed to create directory: {}", e))?;
    Ok(())
}

/// Delete a file or directory
#[tauri::command]
pub fn delete_entry(path: String) -> Result<(), String> {
    let entry_path = Path::new(&path);
    if !entry_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    if entry_path.is_dir() {
        fs::remove_dir_all(entry_path).map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(entry_path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    Ok(())
}

/// Rename a file or directory
#[tauri::command]
pub fn rename_entry(old_path: String, new_path: String) -> Result<(), String> {
    let src = Path::new(&old_path);
    let dst = Path::new(&new_path);
    if !src.exists() {
        return Err(format!("Source path does not exist: {}", old_path));
    }
    fs::rename(src, dst).map_err(|e| format!("Failed to rename: {}", e))?;
    Ok(())
}

/// Get the user's home directory
#[tauri::command]
pub fn get_home_dir() -> Result<String, String> {
    let home = dirs::home_dir()
        .ok_or_else(|| "Could not determine home directory".to_string())?;
    Ok(home.to_string_lossy().to_string())
}