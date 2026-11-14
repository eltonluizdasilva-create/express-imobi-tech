$source_path = "C:\Users\Elton\Desktop\top\files (10)\Admin.jsx"
$target_path = "c:\Users\Elton\Desktop\oficina-ia-master\src\Admin.jsx"

$source_lines = Get-Content -Path $source_path -Encoding UTF8
$snippet = $source_lines[4770..5226]

$target_lines = Get-Content -Path $target_path -Encoding UTF8

Write-Host "Replacing block starting with:"
Write-Host $($target_lines[4362].Trim())
Write-Host "Ending with:"
Write-Host $($target_lines[4384].Trim())

$new_lines = @()
$new_lines += $target_lines[0..4361]
$new_lines += $snippet
$new_lines += $target_lines[4385..($target_lines.Length - 1)]

Set-Content -Path $target_path -Value $new_lines -Encoding UTF8
Write-Host "Done."
