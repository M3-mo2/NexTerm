use anyhow::{Context, Result};
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

/// Terminal configuration for spawning a new PTY
#[derive(Debug, Deserialize)]
pub struct TerminalConfig {
    pub shell: Option<String>,
    pub working_dir: Option<String>,
    pub cols: u16,
    pub rows: u16,
}

/// Event payload sent from backend to frontend for terminal output
#[derive(Debug, Clone, Serialize)]
pub struct TerminalOutputEvent {
    pub id: String,
    pub data: String,
}

/// Event payload for terminal exit
#[derive(Debug, Clone, Serialize)]
pub struct TerminalExitEvent {
    pub id: String,
    pub exit_code: Option<u32>,
}

/// A single terminal instance holding the PTY master and writer
struct TerminalInstance {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
}

// Safety: TerminalInstance is only accessed through Mutex in TerminalManager
unsafe impl Send for TerminalInstance {}
unsafe impl Sync for TerminalInstance {}

/// Manages all active terminal instances
pub struct TerminalManager {
    instances: Mutex<HashMap<String, TerminalInstance>>,
}

impl std::fmt::Debug for TerminalManager {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("TerminalManager").finish()
    }
}

impl TerminalManager {
    pub fn new(_app: AppHandle) -> Self {
        Self {
            instances: Mutex::new(HashMap::new()),
        }
    }
}

/// Create a new terminal PTY instance
#[tauri::command]
pub fn create_terminal(
    app: AppHandle,
    manager: State<'_, TerminalManager>,
    config: TerminalConfig,
) -> Result<String> {
    let id_str = uuid::Uuid::new_v4().to_string();

    let pty_system = native_pty_system();

    let pty_pair = pty_system
        .openpty(PtySize {
            rows: config.rows,
            cols: config.cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .context("Failed to create PTY pair")?;

    // Determine shell to use
    let shell_cmd = config.shell.unwrap_or_else(|| {
        // Default to PowerShell on Windows, fallback to cmd
        if cfg!(target_os = "windows") {
            "powershell.exe".to_string()
        } else {
            std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
        }
    });

    let mut cmd = CommandBuilder::new(shell_cmd);
    if let Some(dir) = config.working_dir {
        cmd.cwd(dir);
    }

    let _child = pty_pair.slave.spawn_command(cmd)?;

    let reader = pty_pair.master.try_reader()?;
    let writer = pty_pair.master.take_writer()?;

    let instance = TerminalInstance {
        master: pty_pair.master,
        writer,
    };

    {
        let mut instances = manager.instances.lock().unwrap();
        instances.insert(id_str.clone(), instance);
    }

    // Spawn a thread to read PTY output and emit events to the frontend
    let terminal_id = id_str.clone();
    let app_handle = app.clone();
    std::thread::spawn(move || {
        let mut buf_reader = BufReader::new(reader);
        let mut buffer = [0u8; 8192];

        loop {
            match buf_reader.read(&mut buffer) {
                Ok(0) => {
                    // EOF - terminal exited
                    let _ = app_handle.emit(
                        "terminal-exit",
                        TerminalExitEvent {
                            id: terminal_id.clone(),
                            exit_code: Some(0),
                        },
                    );
                    break;
                }
                Ok(n) => {
                    // Handle both valid UTF-8 and raw bytes (ANSI escape codes may not be valid UTF-8)
                    let data = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let _ = app_handle.emit(
                        "terminal-output",
                        TerminalOutputEvent {
                            id: terminal_id.clone(),
                            data,
                        },
                    );
                }
                Err(_) => {
                    let _ = app_handle.emit(
                        "terminal-exit",
                        TerminalExitEvent {
                            id: terminal_id.clone(),
                            exit_code: None,
                        },
                    );
                    break;
                }
            }
        }
    });

    Ok(id_str)
}

/// Write input data to a terminal instance
#[tauri::command]
pub fn write_to_terminal(
    manager: State<'_, TerminalManager>,
    id: String,
    data: String,
) -> Result<()> {
    let mut instances = manager.instances.lock().unwrap();
    if let Some(instance) = instances.get_mut(&id) {
        instance.writer.write_all(data.as_bytes())?;
        instance.writer.flush()?;
        Ok(())
    } else {
        anyhow::bail!("Terminal instance not found: {}", id)
    }
}

/// Resize a terminal PTY
#[tauri::command]
pub fn resize_terminal(
    manager: State<'_, TerminalManager>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<()> {
    let instances = manager.instances.lock().unwrap();
    if let Some(instance) = instances.get(&id) {
        instance
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .context("Failed to resize PTY")?;
        Ok(())
    } else {
        anyhow::bail!("Terminal instance not found: {}", id)
    }
}

/// Kill a terminal instance
#[tauri::command]
pub fn kill_terminal(
    manager: State<'_, TerminalManager>,
    id: String,
) -> Result<()> {
    let mut instances = manager.instances.lock().unwrap();
    instances.remove(&id);
    Ok(())
}