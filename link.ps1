if (-not (Test-Path -Path public/extensions/memfs)) {
    New-Item -ItemType Directory -Path public/extensions/memfs
}

# symlink extensions/runway-memfs/* to
$cwd = Get-Location
cmd.exe /c "mklink /D $cwd/public/extensions/memfs $cwd/extensions/runway-memfs"

