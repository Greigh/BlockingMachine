# Create necessary directories
$baseDir = "$env:USERPROFILE\Documents\BlockingMachine"
$directories = @(
  "$baseDir\filters",
  "$baseDir\filters\input",
  "$baseDir\filters\output",
  "$baseDir\logs"
)

foreach ($dir in $directories) {
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
    Write-Host "Created directory: $dir"
  }
}

# Configuration data - this matches your .blockingmachinerc.json
$config = @{
  mongodb = @{
    uri = "mongodb://localhost:27017/blockingmachine"
  }
  output  = @{
    directory = "$baseDir\filters\output"
  }
  sources = @(
    @{
      name     = "EasyList"
      url      = "https://easylist.to/easylist/easylist.txt"
      category = "advertising"
      enabled  = $true
    },
    @{
      name     = "EasyPrivacy"
      url      = "https://easylist.to/easylist/easyprivacy.txt"
      category = "privacy"
      enabled  = $true
    },
    @{
      name     = "AdGuard Base"
      url      = "https://filters.adtidy.org/extension/ublock/filters/2.txt"
      category = "advertising"
      enabled  = $true
    },
    @{
      name     = "AdGuard Mobile"
      url      = "https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/MobileFilter/sections/adservers.txt"
      category = "mobile"
      enabled  = $true
    },
    @{
      name     = "AWAvenue Ads"
      url      = "https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/AWAvenue-Ads-Rule.txt"
      category = "mobile"
      enabled  = $true
    },
    @{
      name     = "Fanboy Annoyance"
      url      = "https://secure.fanboy.co.nz/fanboy-annoyance.txt"
      category = "annoyances"
      enabled  = $true
    },
    @{
      name     = "GetAdmiral Domains"
      url      = "https://raw.githubusercontent.com/LanikSJ/ubo-filters/main/filters/getadmiral-domains.txt"
      category = "advertising" 
      enabled  = $true
    },
    @{
      name     = "AdGuard DNS Filter"
      url      = "https://adguardteam.github.io/HostlistsRegistry/assets/filter_1.txt"
      category = "dns"
      enabled  = $true
    },
    @{
      name     = "AdAway Default Blocklist"
      url      = "https://adguardteam.github.io/HostlistsRegistry/assets/filter_5.txt"
      category = "mobile"
      enabled  = $true
    },
    @{
      name     = "Game Console Adblock List"
      url      = "https://adguardteam.github.io/HostlistsRegistry/assets/filter_45.txt"
      category = "gaming"
      enabled  = $true
    },
    @{
      name     = "Anti-Facebook List"
      url      = "https://adguardteam.github.io/HostlistsRegistry/assets/filter_59.txt"
      category = "privacy"
      enabled  = $true
    },
    @{
      name     = "uBlock Origin Filters"
      url      = "https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/filters.txt"
      category = "advertising"
      enabled  = $true
    },
    @{
      name     = "Blockingmachine Rules"
      url      = "$baseDir\filters\input\blockingmachine-rules.txt"
      category = "Blockingmachine"
      enabled  = $true
    }
  )
}

# Save config
$configPath = "$baseDir\.blockingmachinerc.json"
$config | ConvertTo-Json -Depth 4 | Set-Content -Path $configPath
Write-Host "Saved configuration to $configPath"

# Create empty blockingmachine-rules.txt if it doesn't exist
$customRulesPath = "$baseDir\filters\input\blockingmachine-rules.txt"
if (-not (Test-Path $customRulesPath)) {
  @"
# BlockingMachine Custom Rules
# Add your custom rules below

"@ | Set-Content -Path $customRulesPath
  Write-Host "Created custom rules file at $customRulesPath"
}

# Download all filter lists
Write-Host "Downloading filter lists..."
foreach ($source in $config.sources) {
  if ($source.url -match "^https?://") {
    $fileName = $source.name -replace '\s+', '_'
    $outputPath = "$baseDir\filters\input\$fileName.txt"
    Write-Host "Downloading $($source.name) to $outputPath"
        
    try {
      Invoke-WebRequest -Uri $source.url -OutFile $outputPath
      Write-Host "Successfully downloaded $($source.name)"
    }
    catch {
      Write-Host "Failed to download $($source.name): $_"
    }
  }
}

Write-Host "Filter setup complete!"