param(
    [string]$TestName,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

Push-Location $PSScriptRoot

try {
    if (-not (Test-Path ".\pom.xml")) {
        throw "Place this script beside your project's pom.xml."
    }

    if (Test-Path ".\mvnw.cmd") {
        $maven = Join-Path $PSScriptRoot "mvnw.cmd"
    }
    elseif (Get-Command "mvn.cmd" -ErrorAction SilentlyContinue) {
        $maven = (Get-Command "mvn.cmd").Source
    }
    else {
        throw "No Maven wrapper or Maven installation was found."
    }

    $mavenArgs = @()

    if ($Clean) {
        $mavenArgs += "clean"
    }

    $mavenArgs += "test"

    if ($TestName) {
        $mavenArgs += "-Dtest=$TestName"
    }

    & $maven @mavenArgs
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Write-Host "`nTests passed." -ForegroundColor Green
    }
    else {
        Write-Host "`nTests failed. Review the Maven output above." `
            -ForegroundColor Red
    }
}
finally {
    Pop-Location
}

exit $exitCode