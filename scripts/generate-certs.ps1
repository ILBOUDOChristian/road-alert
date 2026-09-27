$certDir = "..\nginx\certs"
if (!(Test-Path -Path $certDir)) {
    New-Item -ItemType Directory -Force -Path $certDir
}

Write-Host "Génération du certificat auto-signé pour roadalert.com..."

# Exécutable OpenSSL (si installé via Git Bash / WSL ou nativement)
# Comme fallback sous Windows natif sans OpenSSL, vous pouvez utiliser mkcert.
# Voici la commande OpenSSL standard :
$opensslCmd = "openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout $certDir\roadalert.com.key -out $certDir\roadalert.com.crt -subj '/CN=*.roadalert.com/O=RoadAlert/C=FR'"

Write-Host "Veuillez exécuter la commande suivante avec OpenSSL :"
Write-Host $opensslCmd

Write-Host "`nAlternativement, si vous avez 'mkcert' d'installé :"
Write-Host "cd ../nginx/certs"
Write-Host "mkcert -cert-file roadalert.com.crt -key-file roadalert.com.key ""*.roadalert.com"""
