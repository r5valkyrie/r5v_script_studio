// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Read, Write};
use std::path::Path;

// Magic bytes for R5V project files: "R5VP"
const MAGIC_BYTES: [u8; 4] = [0x52, 0x35, 0x56, 0x50];

#[derive(Debug, Serialize, Deserialize)]
pub struct FileItem {
    name: String,
    path: String,
    #[serde(rename = "type")]
    item_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    children: Option<Vec<FileItem>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DirectoryItem {
    name: String,
    #[serde(rename = "isDirectory")]
    is_directory: bool,
    path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModData {
    name: String,
    description: String,
    author: String,
    version: String,
    #[serde(rename = "modId")]
    mod_id: String,
    path: String,
}

// Response types
#[derive(Debug, Serialize)]
pub struct ReadFileResult {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WriteFileResult {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProjectFileReadResult {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    compressed: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProjectFileWriteResult {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    original_size: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    compressed_size: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ListDirectoryResult {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    items: Option<Vec<DirectoryItem>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct OpenModFolderResult {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    tree: Option<Vec<FileItem>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    root_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateModResult {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

// Commands

#[tauri::command]
async fn read_file(file_path: String) -> ReadFileResult {
    match fs::read_to_string(&file_path) {
        Ok(content) => ReadFileResult {
            success: true,
            content: Some(content),
            error: None,
        },
        Err(e) => ReadFileResult {
            success: false,
            content: None,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
async fn write_file(file_path: String, content: String) -> WriteFileResult {
    match fs::write(&file_path, content) {
        Ok(_) => WriteFileResult {
            success: true,
            error: None,
        },
        Err(e) => WriteFileResult {
            success: false,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
async fn read_project_file(file_path: String) -> ProjectFileReadResult {
    match fs::read(&file_path) {
        Ok(data) => {
            // Check for magic bytes
            if data.len() >= 4 && data[0..4] == MAGIC_BYTES {
                // Compressed file
                let compressed_data = &data[4..];
                let mut decoder = GzDecoder::new(compressed_data);
                let mut decompressed = String::new();
                
                match decoder.read_to_string(&mut decompressed) {
                    Ok(_) => ProjectFileReadResult {
                        success: true,
                        content: Some(decompressed),
                        compressed: Some(true),
                        error: None,
                    },
                    Err(e) => ProjectFileReadResult {
                        success: false,
                        content: None,
                        compressed: None,
                        error: Some(format!("Failed to decompress: {}", e)),
                    },
                }
            } else {
                // Plain text file
                match String::from_utf8(data) {
                    Ok(content) => ProjectFileReadResult {
                        success: true,
                        content: Some(content),
                        compressed: Some(false),
                        error: None,
                    },
                    Err(e) => ProjectFileReadResult {
                        success: false,
                        content: None,
                        compressed: None,
                        error: Some(e.to_string()),
                    },
                }
            }
        }
        Err(e) => ProjectFileReadResult {
            success: false,
            content: None,
            compressed: None,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
async fn write_project_file(file_path: String, content: String) -> ProjectFileWriteResult {
    let original_size = content.len();
    
    // Compress with gzip
    let mut encoder = GzEncoder::new(Vec::new(), Compression::best());
    if let Err(e) = encoder.write_all(content.as_bytes()) {
        return ProjectFileWriteResult {
            success: false,
            original_size: None,
            compressed_size: None,
            error: Some(format!("Compression error: {}", e)),
        };
    }
    
    let compressed = match encoder.finish() {
        Ok(data) => data,
        Err(e) => {
            return ProjectFileWriteResult {
                success: false,
                original_size: None,
                compressed_size: None,
                error: Some(format!("Compression finish error: {}", e)),
            };
        }
    };
    
    // Prepend magic bytes
    let mut final_data = MAGIC_BYTES.to_vec();
    final_data.extend(compressed);
    let compressed_size = final_data.len();
    
    match fs::write(&file_path, final_data) {
        Ok(_) => ProjectFileWriteResult {
            success: true,
            original_size: Some(original_size),
            compressed_size: Some(compressed_size),
            error: None,
        },
        Err(e) => ProjectFileWriteResult {
            success: false,
            original_size: None,
            compressed_size: None,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
async fn list_directory(dir_path: String) -> ListDirectoryResult {
    match fs::read_dir(&dir_path) {
        Ok(entries) => {
            let mut items = Vec::new();
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                let path = entry.path().to_string_lossy().to_string();
                let is_directory = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
                items.push(DirectoryItem {
                    name,
                    is_directory,
                    path,
                });
            }
            ListDirectoryResult {
                success: true,
                items: Some(items),
                error: None,
            }
        }
        Err(e) => ListDirectoryResult {
            success: false,
            items: None,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
async fn create_directory(dir_path: String) -> WriteFileResult {
    match fs::create_dir_all(&dir_path) {
        Ok(_) => WriteFileResult {
            success: true,
            error: None,
        },
        Err(e) => WriteFileResult {
            success: false,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
async fn delete_directory(dir_path: String) -> WriteFileResult {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return WriteFileResult {
            success: true,
            error: None,
        };
    }
    
    match fs::remove_dir_all(&dir_path) {
        Ok(_) => WriteFileResult {
            success: true,
            error: None,
        },
        Err(e) => WriteFileResult {
            success: false,
            error: Some(e.to_string()),
        },
    }
}

fn build_file_tree(path: &Path, depth: usize, max_depth: usize) -> Vec<FileItem> {
    if depth > max_depth {
        return Vec::new();
    }
    
    let mut items = Vec::new();
    
    if let Ok(entries) = fs::read_dir(path) {
        let mut entries: Vec<_> = entries.flatten().collect();
        // Sort: directories first, then by name
        entries.sort_by(|a, b| {
            let a_is_dir = a.file_type().map(|t| t.is_dir()).unwrap_or(false);
            let b_is_dir = b.file_type().map(|t| t.is_dir()).unwrap_or(false);
            match (a_is_dir, b_is_dir) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.file_name().cmp(&b.file_name()),
            }
        });
        
        for entry in entries {
            let name = entry.file_name().to_string_lossy().to_string();
            let entry_path = entry.path();
            let path_str = entry_path.to_string_lossy().to_string();
            let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
            
            let children = if is_dir && depth < max_depth {
                Some(build_file_tree(&entry_path, depth + 1, max_depth))
            } else {
                None
            };
            
            items.push(FileItem {
                name,
                path: path_str,
                item_type: if is_dir { "folder".to_string() } else { "file".to_string() },
                children,
            });
        }
    }
    
    items
}

#[tauri::command]
async fn open_mod_folder(folder_path: String) -> OpenModFolderResult {
    let path = Path::new(&folder_path);
    if !path.exists() {
        return OpenModFolderResult {
            success: false,
            tree: None,
            root_path: None,
            error: Some("Folder does not exist".to_string()),
        };
    }
    
    let tree = build_file_tree(path, 0, 3);
    
    OpenModFolderResult {
        success: true,
        tree: Some(tree),
        root_path: Some(folder_path),
        error: None,
    }
}

#[tauri::command]
async fn create_mod(mod_data: ModData) -> CreateModResult {
    let mod_dir = format!("{}/{}", mod_data.path, mod_data.mod_id);
    let mod_path = Path::new(&mod_dir);
    
    if mod_path.exists() {
        return CreateModResult {
            success: false,
            path: None,
            error: Some("Mod directory already exists".to_string()),
        };
    }
    
    // Create directory structure
    let dirs = [
        mod_dir.clone(),
        format!("{}/scripts", mod_dir),
        format!("{}/scripts/vscripts", mod_dir),
        format!("{}/paks", mod_dir),
        format!("{}/audio", mod_dir),
        format!("{}/resource", mod_dir),
    ];
    
    for dir in &dirs {
        if let Err(e) = fs::create_dir_all(dir) {
            return CreateModResult {
                success: false,
                path: None,
                error: Some(format!("Failed to create directory: {}", e)),
            };
        }
    }
    
    // Create mod.vdf
    let vdf_content = format!(
        r#""{}"
{{
    "Name"              "{}"
    "Description"       "{}"
    "Version"           "{}"
    "RequiredOnClient"  "1"
}}"#,
        mod_data.mod_id, mod_data.name, mod_data.description, mod_data.version
    );
    
    if let Err(e) = fs::write(format!("{}/mod.vdf", mod_dir), &vdf_content) {
        return CreateModResult {
            success: false,
            path: None,
            error: Some(format!("Failed to write mod.vdf: {}", e)),
        };
    }
    
    // Create manifest.json
    let manifest = serde_json::json!({
        "name": mod_data.name,
        "description": mod_data.description,
        "version": mod_data.version,
        "author": mod_data.author,
        "modId": mod_data.mod_id,
        "scripts": [],
        "rpaks": [],
        "audio": [],
        "localization": {}
    });
    
    if let Err(e) = fs::write(
        format!("{}/manifest.json", mod_dir),
        serde_json::to_string_pretty(&manifest).unwrap(),
    ) {
        return CreateModResult {
            success: false,
            path: None,
            error: Some(format!("Failed to write manifest.json: {}", e)),
        };
    }
    
    // Create README.md
    let readme = format!(
        r#"# {}

{}

## Author
{}

## Version
{}

## Installation
Place this mod in your mods directory.
"#,
        mod_data.name, mod_data.description, mod_data.author, mod_data.version
    );
    
    if let Err(e) = fs::write(format!("{}/README.md", mod_dir), &readme) {
        return CreateModResult {
            success: false,
            path: None,
            error: Some(format!("Failed to write README.md: {}", e)),
        };
    }
    
    CreateModResult {
        success: true,
        path: Some(mod_dir),
        error: None,
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            read_project_file,
            write_project_file,
            list_directory,
            create_directory,
            delete_directory,
            open_mod_folder,
            create_mod,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
