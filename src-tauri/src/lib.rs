use tauri::Manager;

mod terminal;
mod filesystem;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Store terminal manager in app state
            let term_manager = terminal::TerminalManager::new(app.app_handle().clone());
            app.manage(term_manager);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            terminal::create_terminal,
            terminal::write_to_terminal,
            terminal::resize_terminal,
            terminal::kill_terminal,
            filesystem::read_directory,
            filesystem::read_file_content,
            filesystem::write_file_content,
            filesystem::create_file,
            filesystem::create_directory,
            filesystem::delete_entry,
            filesystem::rename_entry,
            filesystem::get_home_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NexTerm");
}