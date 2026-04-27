use std::fs;
use std::path::Path;
use base64::{engine::general_purpose, Engine as _};

// Command untuk membaca daftar file gambar di sebuah direktori
#[tauri::command]
fn get_images(dir_path: String) -> Result<Vec<String>, String> {
    let mut images = Vec::new();
    let path = Path::new(&dir_path);
    
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                    let ext = ext.to_lowercase();
                    // Filter format gambar yang didukung
                    if ["png", "jpg", "jpeg", "gif", "webp"].contains(&ext.as_str()) {
                        images.push(p.to_string_lossy().into_owned());
                    }
                }
            }
        }
    }
    Ok(images)
}

// Command untuk mengubah file gambar fisik menjadi Base64 string
#[tauri::command]
fn load_image_base64(path: String) -> Result<String, String> {
    match fs::read(&path) {
        Ok(bytes) => {
            let b64 = general_purpose::STANDARD.encode(&bytes);
            let ext = Path::new(&path).extension().unwrap_or_default().to_string_lossy().to_lowercase();
            let mime_type = match ext.as_str() {
                "png" => "image/png",
                "gif" => "image/gif",
                "webp" => "image/webp",
                _ => "image/jpeg",
            };
            Ok(format!("data:{};base64,{}", mime_type, b64))
        },
        Err(e) => Err(format!("Gagal membaca gambar: {}", e))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init()) // Inisialisasi plugin dialog
        .invoke_handler(tauri::generate_handler![get_images, load_image_base64])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}