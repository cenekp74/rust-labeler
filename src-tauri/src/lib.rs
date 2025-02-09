use std::{collections::HashMap, fs, hash::Hash, path::Path};
use serde::{Serialize, Deserialize};
use image::{DynamicImage, ImageReader, ImageFormat};
use std::io::Cursor;
use base64::{engine::general_purpose, Engine as _};

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

fn image_to_base64(img: &DynamicImage) -> Result<String, String> {
    let mut image_data: Vec<u8> = Vec::new();
    img.write_to(&mut Cursor::new(&mut image_data), ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    let res_base64 = general_purpose::STANDARD.encode(image_data);
    Ok(format!("data:image/png;base64,{}", res_base64))
}

#[tauri::command]
fn get_image(image_path: String) -> Result<String, String> {
    let img = ImageReader::open(&image_path).map_err(|e| e.to_string())?.decode().map_err(|e| e.to_string())?;
    image_to_base64(&img)
}

#[tauri::command]
fn get_output(input_path: String, output_filename: String) -> Result<HashMap<String, String>, String> {
    let output_file_path = Path::new(&input_path).join(Path::new(&output_filename));
    if let Ok(file) = fs::File::open(output_file_path) {
        serde_json::from_reader(file).map_err(|e| e.to_string())
    } else {
        Ok(
            HashMap::new()
        )
    }
}

#[tauri::command]
fn add_to_output(input_path: String, output_filename: String, image_filename: String, category: String) -> Result<(), String> {
    let output_file_path = Path::new(&input_path).join(Path::new(&output_filename));
    let mut  output = {
        if let Ok(file) = fs::File::open(&output_file_path) {
            serde_json::from_reader(file).map_err(|e| e.to_string())
        } else {
            Ok(
                HashMap::new()
            )
        }
    }?;
    output.insert(image_filename, category);
    let output = serde_json::to_string_pretty(&output).map_err(|e| e.to_string())?;
    fs::write(output_file_path, output).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![load_settings, save_settings, get_image_filenames, get_image, get_output, add_to_output])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
