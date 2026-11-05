# Samsung Tizen packaging and device validation

Run these commands in PowerShell from the repository root. The static Tizen build is independent of the Node server build and does not package `server.cjs`.

## Build and verify the static project

```powershell
npm ci
npm run type-check
npm run build:tizen
$TizenProject = (Resolve-Path '.\dist\tizen').Path
Get-ChildItem -LiteralPath $TizenProject -Force
if (Test-Path -LiteralPath (Join-Path $TizenProject 'server.cjs')) { throw 'Node server bundle found in the Tizen project.' }
```

## Check Tizen Studio CLI

Install Tizen Studio with the Samsung TV Extension and CLI tools through the official Tizen Studio Package Manager. In a new PowerShell window, locate the tools:

```powershell
Get-Command tizen -ErrorAction Stop
Get-Command sdb -ErrorAction Stop
tizen version
sdb version
```

If the commands are not on `PATH`, set the installation-specific paths, then invoke the tools by full path. Do not assume a default install directory:

```powershell
$TizenStudio = 'C:\tizen-studio' # Replace with the actual installation directory.
$TizenCli = Join-Path $TizenStudio 'tools\ide\bin\tizen.bat'
$Sdb = Join-Path $TizenStudio 'tools\sdb.exe'
if (-not (Test-Path -LiteralPath $TizenCli)) { throw "Tizen CLI not found: $TizenCli" }
if (-not (Test-Path -LiteralPath $Sdb)) { throw "SDB not found: $Sdb" }
```

## Create or select a signing profile

Tizen packages must be signed. In Tizen Studio, open **Tools → Certificate Manager**, create or select a Samsung TV certificate profile, and register the target TV's device ID in its distributor certificate. Keep author/distributor passwords and certificate files private; never add them to the repository. Existing profiles should be backed up securely because updates require the same author certificate.

Run the Tizen Studio web build step, then package its `.buildResult` directory using the profile name. Samsung documents this build-then-package sequence for the TV CLI:

```powershell
$TizenProject = (Resolve-Path '.\dist\tizen').Path
$TizenBuildResult = Join-Path $TizenProject '.buildResult'
$null = & $TizenCli build-web -- $TizenProject
if ($LASTEXITCODE -ne 0) { throw "Tizen web build failed with exit code $LASTEXITCODE" }
if (-not (Test-Path -LiteralPath (Join-Path $TizenBuildResult 'config.xml'))) { throw 'Tizen build output is missing config.xml.' }

$CertificateProfile = 'YOUR_EXISTING_PROFILE_NAME'
Push-Location $TizenBuildResult
try {
    & $TizenCli package -t wgt -s $CertificateProfile -- .
    if ($LASTEXITCODE -ne 0) { throw "Tizen package failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}
$Wgt = Get-ChildItem -LiteralPath $TizenProject -Filter '*.wgt' -File -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $Wgt) { throw 'No WGT was produced.' }
$Wgt.FullName
```

## Connect, install, and launch

Enable Developer Mode on the TV and connect the TV and development computer to the same network. Connect through Tizen Studio Device Manager or SDB; use the serial value returned by `sdb devices`:

```powershell
$TvAddress = '192.0.2.10' # Replace with the TV IP address.
& $Sdb connect $TvAddress
if ($LASTEXITCODE -ne 0) { throw "SDB connect failed with exit code $LASTEXITCODE" }
& $Sdb devices
```

Copy the exact device serial from the output (often `<TV-IP>:26101`), then install and launch. In the generated `config.xml`, the package ID is `9WwEmaC3j7` and the application ID is `9WwEmaC3j7.StreamIndian`; `tizen run -p` takes the application ID:

```powershell
$DeviceSerial = '192.0.2.10:26101' # Replace with the serial shown by sdb devices.
& $TizenCli install -s $DeviceSerial --name $Wgt.Name -- $Wgt.DirectoryName
if ($LASTEXITCODE -ne 0) { throw "Tizen install failed with exit code $LASTEXITCODE" }
& $TizenCli run -s $DeviceSerial -p '9WwEmaC3j7.StreamIndian'
if ($LASTEXITCODE -ne 0) { throw "Tizen launch failed with exit code $LASTEXITCODE" }
```

## Runtime diagnostics

- Reproduce the issue with Tizen Studio's TV emulator or a connected TV and note the app version, TV model, Tizen version, media URL scheme/container (redact credentials), and exact AVPlay state.
- Use Tizen Studio's supported Web Inspector/debugging workflow where available. On emulator targets, SDB log commands may be available; Samsung documents that SDB system-log retrieval is not supported on Samsung TVs, so do not treat an empty `dlog` result as evidence that no error occurred.
- For AVPlay, capture the app's `onerror` callback and the failure stage (`open`, `prepareAsync`, or `play`); include the AVPlay error code. Check stream reachability, codec/container support, DRM requirements, and that the AVPlay display rectangle uses 1920×1080 coordinate space.
- Confirm remote focus after installation, then test channel switching and recovery after a provider/network interruption. Desktop browser and emulator results do not establish physical-TV codec or AVPlay compatibility.

Official references: [Samsung Tizen CLI](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/command-line-interface.html), [Samsung certificate profiles](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html), [AVPlay playback](https://developer.samsung.com/smarttv/develop/guides/multimedia/media-playback/using-avplay.html), [application testing FAQ](https://developer.samsung.com/smarttv/develop/faq/application-testing.html).
