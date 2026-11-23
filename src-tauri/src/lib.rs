// Gemensam start för skrivbord (Windows, Mac) och mobil (Android).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init());
    // Automatiska uppdateringar finns bara i datorappen.
    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        // laddar ner installationsfilen för en ny version direkt i appen
        .plugin(tauri_plugin_upload::init());
    builder
        .run(tauri::generate_context!())
        .expect("Lärarbordet kunde inte starta");
}
