use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaudeResponse {
    pub success: bool,
    pub output: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIUpdateRequest {
    pub user_request: String,
    pub current_path: Option<Vec<String>>,
    pub current_value: Option<serde_json::Value>,
    pub full_prompt: Option<serde_json::Value>,
}

// Claude CLI yolunu bul
fn find_claude_path() -> Option<String> {
    let possible_paths = [
        format!("{}/.local/bin/claude", std::env::var("HOME").unwrap_or_default()),
        "/usr/local/bin/claude".to_string(),
        "/opt/homebrew/bin/claude".to_string(),
        format!("{}/.npm-global/bin/claude", std::env::var("HOME").unwrap_or_default()),
    ];

    for path in &possible_paths {
        if std::path::Path::new(path).exists() {
            return Some(path.clone());
        }
    }

    // Fallback - belki PATH'te
    Some("claude".to_string())
}

// Claude CLI'ı çağıran command
#[tauri::command]
async fn call_claude(prompt: String) -> Result<ClaudeResponse, String> {
    let claude_path = find_claude_path().unwrap_or_else(|| "claude".to_string());

    // Claude CLI'ı çağır
    let output = Command::new(&claude_path)
        .args(["--print", &prompt])
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                let stdout = String::from_utf8_lossy(&result.stdout).to_string();
                Ok(ClaudeResponse {
                    success: true,
                    output: Some(stdout),
                    error: None,
                })
            } else {
                let stderr = String::from_utf8_lossy(&result.stderr).to_string();
                Ok(ClaudeResponse {
                    success: false,
                    output: None,
                    error: Some(stderr),
                })
            }
        }
        Err(e) => {
            Ok(ClaudeResponse {
                success: false,
                output: None,
                error: Some(format!("Failed to execute claude: {}", e)),
            })
        }
    }
}

// AI ile prompt güncelleme
#[tauri::command]
async fn ai_update_value(request: AIUpdateRequest) -> Result<ClaudeResponse, String> {
    let system_prompt = r#"Sen bir prompt mühendisisin. Kullanıcının image generation prompt'larını düzenlemesine yardım ediyorsun.

Kurallar:
1. JSON yapısını koru - yeni key ekleme, var olanı değiştir
2. Sadece istenen alanı güncelle
3. Değişiklikleri Türkçe açıkla
4. Tutarlı ol (diğer alanlarla çelişme)
5. Yaratıcı ol ama mantıklı kal
6. Yanıtı her zaman aşağıdaki JSON formatında ver:

{
  "success": true,
  "updatedValue": <güncellenmiş değer>,
  "explanation": "Yapılan değişikliklerin kısa açıklaması"
}"#;

    let path_str = request.current_path
        .map(|p| p.join("."))
        .unwrap_or_else(|| "root".to_string());

    let current_value_str = request.current_value
        .map(|v| serde_json::to_string_pretty(&v).unwrap_or_default())
        .unwrap_or_else(|| "null".to_string());

    let full_prompt_str = request.full_prompt
        .map(|v| serde_json::to_string_pretty(&v).unwrap_or_default())
        .unwrap_or_else(|| "{}".to_string());

    let user_message = format!(
        r#"Kullanıcı İsteği: "{}"

Seçili Alan: {}

Mevcut Değer:
{}

Tam Prompt Yapısı (bağlam için):
{}

Lütfen kullanıcının isteğine göre sadece seçili alanın değerini güncelle ve JSON formatında yanıt ver."#,
        request.user_request,
        path_str,
        current_value_str,
        full_prompt_str
    );

    let full_prompt = format!("{}\n\n{}", system_prompt, user_message);

    call_claude(full_prompt).await
}

// Claude CLI'ın kurulu olup olmadığını kontrol et
#[tauri::command]
async fn check_claude_installed() -> Result<bool, String> {
    // Bilinen yolları kontrol et
    let possible_paths = [
        format!("{}/.local/bin/claude", std::env::var("HOME").unwrap_or_default()),
        "/usr/local/bin/claude".to_string(),
        "/opt/homebrew/bin/claude".to_string(),
        format!("{}/.npm-global/bin/claude", std::env::var("HOME").unwrap_or_default()),
    ];

    for path in &possible_paths {
        if std::path::Path::new(path).exists() {
            return Ok(true);
        }
    }

    Ok(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            call_claude,
            ai_update_value,
            check_claude_installed
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
