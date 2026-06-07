use std::process::Command;
use sha2::{Sha256, Digest};
use std::fs;
use rfd::FileDialog;

fn get_motherboard_uuid() -> String {
    let output = Command::new("cmd")
        .args(&["/C", "wmic csproduct get uuid"])
        .output();
    
    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout);
        let lines: Vec<&str> = text.lines()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty() && *s != "UUID")
            .collect();
        if let Some(uuid) = lines.first() {
            return uuid.to_string();
        }
    }
    "UNKNOWN_UUID".to_string()
}

fn get_machine_guid() -> String {
    let output = Command::new("cmd")
        .args(&["/C", "reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid"])
        .output();
    
    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout);
        for line in text.lines() {
            if line.contains("MachineGuid") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if let Some(guid) = parts.last() {
                    return guid.to_string();
                }
            }
        }
    }
    "UNKNOWN_GUID".to_string()
}

#[tauri::command]
fn obter_assinatura_fisica() -> String {
    let motherboard = get_motherboard_uuid();
    let machine_guid = get_machine_guid();
    
    // Concatenar os dois valores para garantir redundância
    let combined = format!("{}-{}", motherboard, machine_guid);
    
    // Calcular SHA-256
    let mut hasher = Sha256::new();
    hasher.update(combined.as_bytes());
    let result = hasher.finalize();
    
    // Retornar hash hexadecimal de 64 caracteres
    format!("{:x}", result)
}

#[tauri::command]
fn reiniciar_aplicacao(app_handle: tauri::AppHandle) {
    app_handle.restart();
}

#[tauri::command]
fn salvar_arquivo_backup(conteudo: String) -> Result<String, String> {
    let file_path = FileDialog::new()
        .set_title("Salvar Backup do Sistema")
        .add_filter("Backup JSON", &["json"])
        .set_file_name("backup_reserva_armamento.json")
        .save_file();

    if let Some(path) = file_path {
        match fs::write(&path, conteudo) {
            Ok(_) => Ok(format!("Arquivo salvo com sucesso em: {}", path.to_string_lossy())),
            Err(e) => Err(format!("Erro ao gravar arquivo: {}", e)),
        }
    } else {
        Err("Operação cancelada pelo usuário.".to_string())
    }
}

#[tauri::command]
fn abrir_arquivo_backup() -> Result<String, String> {
    let file_path = FileDialog::new()
        .set_title("Selecionar Arquivo de Backup")
        .add_filter("Backup JSON", &["json"])
        .pick_file();

    if let Some(path) = file_path {
        match fs::read_to_string(&path) {
            Ok(content) => Ok(content),
            Err(e) => Err(format!("Erro ao ler arquivo: {}", e)),
        }
    } else {
        Err("Operação cancelada pelo usuário.".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .build(),
    )
    .invoke_handler(tauri::generate_handler![
        obter_assinatura_fisica,
        reiniciar_aplicacao,
        salvar_arquivo_backup,
        abrir_arquivo_backup
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// Força recompilação para atualizar permissões de capacidades (v0.2.14-rfd)
