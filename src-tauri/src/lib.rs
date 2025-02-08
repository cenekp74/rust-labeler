use std::{fs, path::Path};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
struct Settings {
    input_path: Option<String>,
    output_file_name: String,
    categories: Vec<String>,
}

impl Settings {
    fn default() -> Self {
        Settings {
            input_path: None,
            output_file_name: "output.json".to_string(),
            categories: vec![],
        }
    }
}

#[tauri::command]
fn load_settings() -> Result<Settings, String> {
    let settings_file_path = Path::new("settings.json");

    if let Ok(file) = fs::File::open(settings_file_path) {
        serde_json::from_reader(file).map_err(|e| e.to_string())
    } else {
        Ok(Settings::default())
    }
}

#[tauri::command]
fn save_settings(settings: Settings) -> Result<(), String> {
    let settings_file_path = Path::new("settings.json");
    let data = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;

    fs::write(settings_file_path, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_image_filenames(input_path: String) -> Result<Vec<String>, String> {
    let input_path = Path::new(&input_path);
    let mut filenames = Vec::new();

    for entry in fs::read_dir(input_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if let Some(name) = entry.file_name().to_str() {
            if !name.to_string().to_lowercase().ends_with(".png") { continue; }
            filenames.push(name.to_string());
        }
    }
    Ok(filenames)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![load_settings, save_settings, get_image_filenames])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
